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

export interface UpcomingStreakProgram {
  id: number;
  store_id: number;
  title: string | null;
  start_at: string | null;
  end_date: string | null;
  streak_length: number | null;
  reward_description: string | null;
}

export type StampResult = {
  success: boolean;
  reason?: "already_stamped_today" | "already_completed" | "stamp_not_enabled" | "card_expired" | "error";
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
  purchaseId?: number | string | null
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
    // 2. Fetch the active stamp program to get real target
    // ──────────────────────────────────────────────
    const { data: stampPrograms, error: stampProgramError } = await supabase
      .from("store_stamps")
      .select("id, total_stamps")
      .eq("store_id", storeId)
      .eq("status", "active");

    if (stampProgramError) {
      console.error("[addStamp] Error fetching active stamp program:", stampProgramError);
    }

    const stampProgram = stampPrograms?.[0] ?? null;

    if (!stampProgram) {
      console.warn(`[addStamp] CRITICAL: No active stamp program found for store_id=${storeId}. Falling back to target 7. Check if program is truly active or if RLS blocked it.`);
    }

    const programTarget = stampProgram?.total_stamps ?? 7;
    const programId = stampProgram?.id ?? null;

    // ──────────────────────────────────────────────
    // 3. Check existing stamp_progress
    // ──────────────────────────────────────────────
    const { data: existingProgress, error: fetchError } = await supabase
      .from("stamp_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking existing stamp progress:", fetchError.message);
      return { success: false, reason: "error" };
    }

    const now = new Date().toISOString();

    // ──────────────────────────────────────────────
    // 4. Upsert stamp_progress
    // ──────────────────────────────────────────────
    if (existingProgress) {
      // ✅ BLOCKER: Card is expired
      if (existingProgress.card_expires_at && new Date(now) > new Date(existingProgress.card_expires_at)) {
        return { success: false, reason: "card_expired" };
      }

      // ✅ BLOCKER: Stamp card already completed — cannot earn more stamps
      // Automatically heal/sync the DB target to the active program's true target
      const trueTarget = programTarget;
      
      if (
        existingProgress.card_status === "completed" ||
        existingProgress.stamps_count >= trueTarget
      ) {
        return { success: false, reason: "already_completed" };
      }

      const newStampsCount = existingProgress.stamps_count + 1;
      const justCompleted = newStampsCount >= trueTarget;

      const { error: updateError } = await supabase
        .from("stamp_progress")
        .update({
          stamps_count: newStampsCount,
          target: trueTarget, // <-- Force upgrade to new active program target
          last_stamp_at: now,
          updated_at: now,
          ...(justCompleted && { card_status: "completed" }),
        })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating stamp progress:", updateError.message);
        return { success: false, reason: "error" };
      }
    } else {
      // Brand new row — link to the active program with the real target
      const justCompleted = programTarget <= 1;

      const { error: insertError } = await supabase
        .from("stamp_progress")
        .insert({
          user_id: userId,
          store_id: storeId,
          stamps_count: 1,
          target: programTarget,
          stamp_program_id: programId,
          card_started_at: now,
          last_stamp_at: now,
          updated_at: now,
          card_status: justCompleted ? "completed" : "active",
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
      let newStampCount = existingReward.current_stamp_count + 1;

      // If count has reached target (full cycle completed), reset to 1
      if (existingReward.current_stamp_count >= programTarget) {
        newStampCount = 1;
      }

      const { error: rewardUpdateError } = await supabase
        .from("stamp_rewards")
        .update({
          current_stamp_count: newStampCount,
          target_stamps: programTarget, // <-- Auto-heal legacy targets!
          last_stamp_date: todayDate,
          updated_at: now,
        })
        .eq("id", existingReward.id);

      if (rewardUpdateError) {
        console.error("Error updating stamp reward:", rewardUpdateError.message);
      }
    } else {
      // First-ever stamp for this store → create reward row
      const { error: rewardInsertError } = await supabase
        .from("stamp_rewards")
        .insert({
          user_id: userId,
          store_id: storeId,
          current_stamp_count: 1,
          target_stamps: programTarget,
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
        ...(purchaseId && { purchase_id: purchaseId })
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
      .eq("status", "active");

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
    // ── Step 1: Check which stores have streak_enabled = true ────────────────
    const { data: featureRows, error: featureError } = await supabase
      .from("store_feature")
      .select("store_id, streak_enabled")
      .in("store_id", storeIds);

    if (featureError) {
      console.warn("[getStoresWithEnabledStreaks] Could not read store_feature:", featureError.message);
      return [];
    }

    // Store IDs where the feature flag is explicitly enabled
    const featureEnabledIds = (featureRows ?? [])
      .filter((row: any) => row.streak_enabled === true)
      .map((row: any) => Number(row.store_id));

    if (featureEnabledIds.length === 0) return [];

    // ── Step 2: Cross-check against store_streaks — must have an active program ─
    // A streak_enabled flag alone is not enough; the store must also have an
    // active streak program row. If the program has ended (status ≠ 'active'),
    // the card should be hidden even if the feature flag is still on.
    const { data: activeStreakRows, error: streakError } = await supabase
      .from("store_streaks")
      .select("store_id")
      .in("store_id", featureEnabledIds)
      .eq("status", "active");

    if (streakError) {
      // If we can't read store_streaks, fall back to feature flag only.
      // This avoids hiding the card due to an RLS or network issue.
      console.warn(
        "[getStoresWithEnabledStreaks] Could not read store_streaks, falling back to feature flag only:",
        streakError.message,
      );
      return featureEnabledIds;
    }

    // Return only the stores that satisfy BOTH conditions:
    // 1. streak_enabled = true in store_feature
    // 2. at least one row with status = 'active' in store_streaks
    const activeStreakStoreIds = new Set(
      (activeStreakRows ?? []).map((row: any) => Number(row.store_id)),
    );

    return featureEnabledIds.filter((id) => activeStreakStoreIds.has(id));
  } catch (error) {
    console.error("Exception fetching eligible streak stores:", error);
    return [];
  }
}

/**
 * Returns a map of storeId → active store_streaks.id for the given stores.
 * Used to populate store_streak_id in virtual (first-time) streak entries.
 */
export async function getActiveStreakProgramsByStore(
  storeIds: number[],
): Promise<Map<number, number>> {
  if (storeIds.length === 0) return new Map();

  try {
    const { data, error } = await supabase
      .from("store_streaks")
      .select("id, store_id")
      .in("store_id", storeIds)
      .eq("status", "active");

    if (error) {
      console.warn("[getActiveStreakProgramsByStore] Error:", error.message);
      return new Map();
    }

    const map = new Map<number, number>();
    for (const row of data ?? []) {
      map.set(Number(row.store_id), Number(row.id));
    }
    return map;
  } catch (error) {
    console.error("Exception fetching active streak programs:", error);
    return new Map();
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
      .eq("status", "active");

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

export async function getStampEventsForStore(
  userId: string,
  storeId: number | string
) {
  try {
    const { data, error } = await supabase
      .from("stamp_events")
      .select(`
        id, 
        created_at,
        purchases (
          points_earned
        )
      `)
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stamp events:", error.message);
      return [];
    }

    return (data || []).map(evt => ({
      ...evt,
      points: (evt.purchases as any)?.points_earned
    }));
  } catch (err) {
    console.error("Exception fetching stamp events:", err);
    return [];
  }
}

export async function getUserStampEvents(userId: string) {
  try {
    const { data, error } = await supabase
      .from("stamp_events")
      .select(`
        id, 
        created_at,
        store_id,
        purchases (
          points_earned
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all user stamp events:", error.message);
      return [];
    }

    return (data || []).map(evt => ({
      ...evt,
      points: (evt.purchases as any)?.points_earned
    }));
  } catch (err) {
    console.error("Exception fetching all user stamp events:", err);
    return [];
  }
}

export async function getUserRewardRedemptions(
  userId: string,
  storeId?: number | string
) {
  try {
    let query = supabase
      .from("reward_redemptions")
      .select(`
        id,
        created_at,
        points_spent,
        store_id,
        store_rewards (
          title,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reward redemptions:", error.message);
      return [];
    }

    return (data || []).map(evt => ({
      id: evt.id,
      redeemed_at: evt.created_at,
      title: (evt.store_rewards as any)?.title || "Reward Claimed",
      image_url: (evt.store_rewards as any)?.image_url,
      points_spent: evt.points_spent,
      store_id: evt.store_id
    }));
  } catch (err) {
    console.error("Exception fetching reward redemptions:", err);
    return [];
  }
}

/**
 * Returns a map of storeId → upcoming store_streaks program for the given stores.
 * A program is "upcoming" when its status = 'upcoming' (start_at is in the future
 * and the program has not yet gone live).
 */
export async function getUpcomingStreakProgramsByStore(
  storeIds: number[],
): Promise<Map<number, UpcomingStreakProgram>> {
  if (storeIds.length === 0) return new Map();

  try {
    // ── Step 1: Check which stores have streak_enabled = true ────────────────
    const { data: featureRows, error: featureError } = await supabase
      .from("store_feature")
      .select("store_id, streak_enabled")
      .in("store_id", storeIds);

    if (featureError) {
      console.warn("[getUpcomingStreakProgramsByStore] Could not read store_feature:", featureError.message);
      return new Map();
    }

    const featureEnabledIds = (featureRows ?? [])
      .filter((row: any) => row.streak_enabled === true)
      .map((row: any) => Number(row.store_id));

    if (featureEnabledIds.length === 0) return new Map();

    // ── Step 2: Fetch upcoming programs for only enabled stores
    const { data, error } = await supabase
      .from("store_streaks")
      .select("id, store_id, title, start_at, end_date, streak_length, reward_description")
      .in("store_id", featureEnabledIds)
      .eq("status", "upcoming");

    if (error) {
      console.warn("[getUpcomingStreakProgramsByStore] Error:", error.message);
      return new Map();
    }

    const map = new Map<number, UpcomingStreakProgram>();
    for (const row of data ?? []) {
      // If multiple upcoming rows exist per store, keep the one starting soonest
      const storeId = Number(row.store_id);
      if (!map.has(storeId)) {
        map.set(storeId, {
          id: Number(row.id),
          store_id: storeId,
          title: row.title ?? null,
          start_at: row.start_at ?? null,
          end_date: row.end_date ?? null,
          streak_length: row.streak_length ?? null,
          reward_description: row.reward_description ?? null,
        });
      }
    }
    return map;
  } catch (error) {
    console.error("Exception fetching upcoming streak programs:", error);
    return new Map();
  }
}
