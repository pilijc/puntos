import { supabase } from "@/supabase/supabase";

export interface StampProgress {
  id: number;
  user_id: string;
  store_id: number;
  stamps_count: number;
  target: number;
  last_stamp_at: string;
  updated_at: string;
  stores?: {
    name: string;
    logo?: string;
    status: string;
    is_active: boolean;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface ActiveStampProgramReward {
  store_id: number;
  total_stamps: number;
  reward_id: string;
  reward_title: string | null;
  reward_image_url: string | null;
}

export type StampResult = {
  success: boolean;
  reason?: "already_stamped_today" | "stamp_not_enabled" | "error";
};

export async function getUserStamps(userId: string): Promise<StampProgress[]> {
  try {
    const { data, error } = await supabase
      .from("stamp_progress")
      .select(`
        *,
        stores (
          name,
          logo,
          status,
          is_active,
          latitude,
          longitude,
          address
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user stamp progress:", error.message);
      return [];
    }

    // Filter out stamps for stores that are not active
    const validStamps = (data as unknown as StampProgress[]).filter(
      (stamp) => stamp.stores?.status === "active" && stamp.stores?.is_active
    );

    return validStamps;
  } catch (error) {
    console.error("Exception fetching user stamp progress:", error);
    return [];
  }
}

/**
 * Helper: check whether two ISO date strings fall on the same calendar day
 * using the device's local timezone.
 */
function isSameDay(dateStr1: string, dateStr2: string): boolean {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get today's date as YYYY-MM-DD in the local timezone (for user_streaks.last_activity_date which is a `date` column).
 */
function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function addStamp(
  userId: string,
  storeId: number | string,
): Promise<StampResult> {
  try {
    // ──────────────────────────────────────────────
    // 1. Check store_feature.stamp_enabled
    // ──────────────────────────────────────────────
    console.log("[addStamp] Starting for userId:", userId, "storeId:", storeId);

    const { data: featureRow, error: featureError } = await supabase
      .from("store_feature")
      .select("stamp_enabled")
      .eq("store_id", storeId)
      .maybeSingle();

    console.log("[addStamp] store_feature result:", { featureRow, featureError: featureError?.message, code: featureError?.code });

    if (featureError) {
      // RLS or network issue — log but don't block the stamp
      console.warn("[addStamp] Could not read store_feature (possibly RLS). Proceeding anyway.");
    }

    // Only block if we got a row AND stamp_enabled is explicitly false
    if (featureRow && featureRow.stamp_enabled === false) {
      console.log("[addStamp] Blocked: stamp_not_enabled. featureRow:", featureRow);
      return { success: false, reason: "stamp_not_enabled" };
    }

    // ──────────────────────────────────────────────
    // 2. Check existing stamp_progress for daily limit
    // ──────────────────────────────────────────────
    const { data: existingProgress, error: fetchError } = await supabase
      .from("stamp_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking existing stamp progress:", fetchError.message);
      return { success: false, reason: "error" };
    }

    const now = new Date().toISOString();

    // If user already stamped today for this store → reject
    if (existingProgress?.last_stamp_at && isSameDay(existingProgress.last_stamp_at, now)) {
      return { success: false, reason: "already_stamped_today" };
    }

    // ──────────────────────────────────────────────
    // 3. Upsert stamp_progress
    // ──────────────────────────────────────────────
    if (existingProgress) {
      const newStampsCount = existingProgress.stamps_count + 1;

      const { error: updateError } = await supabase
        .from("stamp_progress")
        .update({
          stamps_count: newStampsCount,
          last_stamp_at: now,
          updated_at: now,
        })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating stamp progress:", updateError.message);
        return { success: false, reason: "error" };
      }
    } else {
      // Brand new row
      const { error: insertError } = await supabase
        .from("stamp_progress")
        .insert({
          user_id: userId,
          store_id: storeId,
          stamps_count: 1,
          target: 7,
          last_stamp_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error("Error inserting new stamp progress:", insertError.message);
        return { success: false, reason: "error" };
      }
    }

    // ──────────────────────────────────────────────
    // 4. Upsert stamp_rewards
    //    Rewards reset after reaching 7 (full cycle).
    // ──────────────────────────────────────────────
    const todayDate = todayLocalDate();

    const { data: existingReward, error: rewardFetchError } = await supabase
      .from("stamp_rewards")
      .select("*")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .single();

    if (rewardFetchError && rewardFetchError.code !== "PGRST116") {
      console.error("Error fetching stamp reward:", rewardFetchError.message);
    }

    if (existingReward) {
      // If already logged for today, skip reward update
      if (existingReward.last_stamp_date !== todayDate) {
        let newStampCount = existingReward.current_stamp_count + 1;

        // If count has reached target (full cycle completed), reset to 1
        if (existingReward.current_stamp_count >= existingReward.target_stamps) {
          newStampCount = 1;
        }

        const { error: rewardUpdateError } = await supabase
          .from("stamp_rewards")
          .update({
            current_stamp_count: newStampCount,
            last_stamp_date: todayDate,
            updated_at: now,
          })
          .eq("id", existingReward.id);

        if (rewardUpdateError) {
          console.error("Error updating stamp reward:", rewardUpdateError.message);
        }
      }
    } else {
      // First-ever stamp for this store → create reward row
      const { error: rewardInsertError } = await supabase
        .from("stamp_rewards")
        .insert({
          user_id: userId,
          store_id: storeId,
          current_stamp_count: 1,
          target_stamps: 7, // default target
          last_stamp_date: todayDate,
        });

      if (rewardInsertError) {
        console.error("Error inserting stamp reward:", rewardInsertError.message);
      }
    }

    // ──────────────────────────────────────────────
    // 5. Log stamp_events
    // ──────────────────────────────────────────────
    const { error: eventError } = await supabase
      .from("stamp_events")
      .insert({
        user_id: userId,
        store_id: storeId,
      });

    if (eventError) {
      // Non-critical — log but don't fail the stamp
      console.error("Error logging stamp event:", eventError.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Exception adding stamp:", error);
    return { success: false, reason: "error" };
  }
}

export async function getStoresWithEnabledActiveStampProgram(
  storeIds: number[],
): Promise<number[]> {
  if (storeIds.length === 0) return [];

  try {
    const { data: stampRows, error: stampError } = await supabase
      .from("store_stamps")
      .select("store_id")
      .in("store_id", storeIds)
      .eq("is_active", true);

    const activeStoreIds = stampError
      ? []
      : Array.from(new Set((stampRows ?? []).map((row: any) => Number(row.store_id))));

    // Prefer strict enforcement (stamp_enabled + active program).
    // If feature read is blocked by RLS in user context, gracefully fallback to active programs.
    const { data: featureRows, error: featureError } = await supabase
      .from("store_feature")
      .select("store_id, stamp_enabled")
      .in("store_id", storeIds);

    const featureFlagByStoreId = new Map<number, boolean | null>(
      (featureRows ?? []).map((row: any) => [
        Number(row.store_id),
        row.stamp_enabled as boolean | null,
      ]),
    );

    // Match addStamp() behavior: block only when stamp_enabled is explicitly false.
    // If feature row is missing, treat it as allowed.
    const isFeatureAllowed = (storeId: number) =>
      featureFlagByStoreId.get(storeId) !== false;

    // Best case: both queries readable -> strict intersection.
    if (!stampError && !featureError) {
      return activeStoreIds.filter((id) => isFeatureAllowed(id));
    }

    // If one side is blocked by RLS, fallback to the side we can read.
    if (stampError && !featureError) {
      console.warn(
        "store_stamps is not readable in current context; falling back to stamp_enabled stores.",
      );
      return storeIds.filter((id) => isFeatureAllowed(id));
    }

    if (!stampError && featureError) {
      console.warn(
        "store_feature is not readable in current context; falling back to active stamp programs.",
      );
      return activeStoreIds;
    }

    // If both are unreadable, avoid emptying the UI; defer strict validation to actual stamp action.
    console.warn(
      "store_stamps and store_feature are not readable in current context; falling back to nearby stores.",
    );
    return storeIds;
  } catch (error) {
    console.error("Exception fetching eligible stamp stores:", error);
    return storeIds;
  }
}

export async function getStoresWithEnabledStreaks(
  storeIds: number[],
): Promise<number[]> {
  if (storeIds.length === 0) return [];

  try {
    const { data: featureRows, error: featureError } = await supabase
      .from("store_feature")
      .select("store_id, streak_enabled")
      .in("store_id", storeIds);

    if (featureError) {
      console.warn("[getStoresWithEnabledStreaks] Could not read store_feature:", featureError.message);
      return [];
    }

    return (featureRows ?? [])
      .filter((row: any) => row.streak_enabled === true)
      .map((row: any) => Number(row.store_id));
  } catch (error) {
    console.error("Exception fetching eligible streak stores:", error);
    return [];
  }
}

export async function getActiveStampProgramRewards(
  storeIds: number[],
): Promise<ActiveStampProgramReward[]> {
  if (storeIds.length === 0) return [];

  try {
    const { data: stampRows, error: stampError } = await supabase
      .from("store_stamps")
      .select("store_id, total_stamps, reward_id")
      .in("store_id", storeIds)
      .eq("is_active", true);

    if (stampError) {
      throw new Error(stampError.message);
    }

    const activePrograms = (stampRows ?? []) as Array<{
      store_id: number | string;
      total_stamps: number;
      reward_id: string;
    }>;

    if (activePrograms.length === 0) return [];

    const rewardIds = Array.from(
      new Set(activePrograms.map((row) => row.reward_id).filter(Boolean)),
    );

    const { data: rewardRows, error: rewardError } = await supabase
      .from("store_rewards")
      .select("id, title, image_url")
      .in("id", rewardIds);

    if (rewardError) {
      throw new Error(rewardError.message);
    }

    const rewardById = new Map(
      (rewardRows ?? []).map((row: any) => [
        String(row.id),
        {
          title: row.title as string | null,
          image_url: row.image_url as string | null,
        },
      ]),
    );

    return activePrograms.map((program) => {
      const reward = rewardById.get(String(program.reward_id));
      return {
        store_id: Number(program.store_id),
        total_stamps: program.total_stamps,
        reward_id: program.reward_id,
        reward_title: reward?.title ?? null,
        reward_image_url: reward?.image_url ?? null,
      };
    });
  } catch (error) {
    console.error("Exception fetching active stamp program rewards:", error);
    return [];
  }
}
