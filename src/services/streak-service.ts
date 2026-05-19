import { supabase } from "@/supabase/supabase";
import {
  getStoreOwnerId,
  ownerCanManagePremiumCampaigns,
} from "@/services/store-manager/premium-campaign-gate";
export const STREAK_NEW_ENROLLMENT_BLOCKED = "STREAK_NEW_ENROLLMENT_BLOCKED";
import { withPostGISCoordinates } from "@/utils/location";

export interface RecordStreakResult {
  alreadyRecorded: boolean;
  newStreakDays: number;
  pointsEarned: number;
  /** true when this call pushed the user to exactly streakLength (just completed) */
  justCompleted: boolean;
}

// NOTE: formatLocalDate is kept for read-only display uses (calendar, earned dates).
// It is NOT used as authority for reward eligibility — that is handled server-side.
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Records a streak day for the user via a server-authoritative DB RPC.
 *
 * The RPC (`record_user_streak`) owns all time logic:
 *   - It computes "today" and "yesterday" from DB now() in the store's snapshotted timezone.
 *   - It blocks duplicate claims for the same store-local business day.
 *   - It computes consecutive-day logic from store-local dates, not device dates.
 *
 * NOTE (Phase 1): The caller (user-streak-card.tsx) still performs a client-side
 * "nearby store" gate before invoking this RPC. That gate is intentionally
 * client-side only in this phase. Server-side location enforcement is deferred
 * to Phase 2 (location anti-cheat).
 *
 * @param pointsPerDay - Ignored; the RPC derives points from the program config.
 * @param streakLength - Ignored; the RPC derives the cap from the program config.
 */
export async function recordUserStreak(
  userId: string,
  storeId: number,
  storeStreakId: number,
  pointsPerDay: number = 0,   // kept for call-site compatibility, unused
  streakLength: number = 0,   // kept for call-site compatibility, unused
): Promise<RecordStreakResult> {
  try {
    const ownerId = await getStoreOwnerId(storeId);
    const premium = await ownerCanManagePremiumCampaigns(ownerId);
    if (!premium) {
      const { data: existingEnrollment, error: enrolErr } = await supabase
        .from("user_streaks")
        .select("id")
        .eq("user_id", userId)
        .eq("store_streak_id", storeStreakId)
        .maybeSingle();

      if (enrolErr) {
        console.warn("[recordUserStreak] Enrollment lookup failed:", enrolErr.message);
      } else if (!existingEnrollment) {
        throw new Error(STREAK_NEW_ENROLLMENT_BLOCKED);
      }
    }

    const { data, error } = await supabase.rpc('record_user_streak', {
      p_user_id: userId,
      p_store_id: storeId,
      p_store_streak_id: storeStreakId,
    });

    if (error) {
      console.error('[recordUserStreak] RPC error:', error.message);
      throw new Error(error.message);
    }

    const result = data as {
      alreadyRecorded: boolean;
      newStreakDays: number;
      pointsEarned: number;
      justCompleted: boolean;
      earnedDate?: string;
      programTimezone?: string;
      reason?: string;
    };

    return {
      alreadyRecorded: result.alreadyRecorded ?? false,
      newStreakDays: result.newStreakDays ?? 0,
      pointsEarned: result.pointsEarned ?? 0,
      justCompleted: result.justCompleted ?? false,
    };
  } catch (err) {
    console.error('[recordUserStreak] Exception:', err);
    throw err;
  }
}

/**
 * Fetch all earned dates from streak_events for a given user + store.
 * Returns a Set of "YYYY-MM-DD" strings in the user's LOCAL timezone.
 * Used by the activity calendar so it shows real per-day history.
 *
 * Pass storeStreakId to scope results to a specific program and prevent old
 * program events from contaminating the new program's weekly circles.
 */
export async function getStreakEarnedDates(
  userId: string,
  storeId: number,
  storeStreakId?: number,
): Promise<Set<string>> {
  let query = supabase
    .from("streak_events")
    .select("earned_date")
    .eq("user_id", userId)
    .eq("store_id", storeId);

  if (storeStreakId) {
    query = query.eq("store_streak_id", storeStreakId);
  }

  const { data, error } = await query
    .order("earned_date", { ascending: false })
    .limit(365); // cap at one year of history

  if (error) {
    console.error("Error fetching streak earned dates:", error.message);
    return new Set();
  }

  // earned_date comes as "YYYY-MM-DD" from Supabase (a `date` column)
  return new Set((data ?? []).map((row: { earned_date: string }) => row.earned_date));
}

export interface UserStreakProgram {
  id: number;
  title: string | null;
  streak_length: number | null;
  max_days_cap: number | null;
  fixed_points_per_day: number | null;
  points_mode: string | null;
  starting_points: number | null;
  increment_value: number | null;
  completion_bonus_points: number | null;
  reward_description: string | null;
  status: string | null;
  start_at?: string | null;
  end_date?: string | null;
}

export interface UserStreak {
  id: number;
  user_id: string;
  store_id: number;
  streak_days: number;
  last_activity_date: string;
  total_earned_days: number;
  points_earned: number;
  completion_bonus_awarded: boolean;
  completed_at: string | null;
  status: "in_progress" | "completed" | "ended" | null;
  store_streak_id: number | null;
  store_streaks?: UserStreakProgram | null;
  streak_events?: { earned_date: string }[];
  stores?: {
    name: string;
    logo?: string;
    address?: string;
    status: string;
    is_active: boolean;
    latitude?: number | null;
    longitude?: number | null;
    location?: any;
    radius?: number | null;
  };
}

const USER_STREAK_SELECT = `
  id, user_id, store_id, streak_days, last_activity_date,
  total_earned_days, points_earned, completion_bonus_awarded,
  completed_at, status, store_streak_id,
  store_streaks (
    id,
    title,
    streak_length,
    max_days_cap,
    fixed_points_per_day,
    points_mode,
    starting_points,
    increment_value,
    completion_bonus_points,
    reward_description,
    status,
    start_at,
    end_date
  ),
  streak_events (
    earned_date
  ).order(earned_date.desc).limit(90),
  stores (
    name,
    logo,
    address,
    status,
    is_active,
    location,
    radius
  )
`;

function isValidStreakStore(streak: UserStreak | null | undefined) {
  return streak?.stores?.status === "active" && streak.stores?.is_active;
}

function buildVirtualUserStreak(
  store: {
    id: number;
    name: string;
    logo?: string | null;
    address?: string | null;
    status: string;
    is_active: boolean;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number | null;
  },
  program: UserStreakProgram | null,
): UserStreak {
  return {
    id: -Number(store.id),
    user_id: "",
    store_id: Number(store.id),
    streak_days: 0,
    last_activity_date: "",
    total_earned_days: 0,
    points_earned: 0,
    completion_bonus_awarded: false,
    completed_at: null,
    status: null,
    store_streak_id: program?.id ?? null,
    store_streaks: program,
    stores: {
      name: store.name,
      logo: store.logo ?? undefined,
      address: store.address ?? undefined,
      status: store.status,
      is_active: store.is_active,
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
      radius: store.radius ?? null,
    },
  };
}

export async function getUserStreaks(userId: string): Promise<UserStreak[]> {
  try {
    console.log("[getUserStreaks] 🔍 Starting fetch for userId:", userId);
    
    const { data, error } = await supabase
      .from("user_streaks")
      .select(USER_STREAK_SELECT)
      .eq("user_id", userId)
      .gt("streak_days", 0)
      .order("streak_days", { ascending: false });

    if (error) {
      console.error("[getUserStreaks] ❌ Supabase error:", error.message);
      return [];
    }

    console.log("[getUserStreaks] ✅ Raw data received:", {
      count: data?.length ?? 0,
      fullRecords: data?.map(s => ({
        id: s.id,
        store_id: s.store_id,
        streak_days: s.streak_days,
        status: s.status,
        store_streaks_status: s.store_streaks?.status,
        store_name: s.stores?.name,
        store_active: s.stores?.is_active,
        stores_full: JSON.stringify(s.stores),
      })) ?? [],
    });

    // ⚠️ RLS issue: stores relationship comes back as undefined even with RLS policy
    // Workaround: fetch stores data SEPARATELY by store_id
    console.log("[getUserStreaks] 🔧 Fetching stores separately due to RLS relationship issue");
    
    const storeIds = (data ?? []).map(s => s.store_id);
    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, name, logo, address, status, is_active, location, radius")
      .in("id", storeIds);

    if (storesError) {
      console.error("[getUserStreaks] ⚠️ Error fetching stores separately:", storesError.message);
    } else {
      console.log("[getUserStreaks] ✅ Fetched stores separately:", storesData?.length);
    }

    // Create a map of stores by id
    const storesMap = new Map(
      (storesData ?? []).map(s => [s.id, s])
    );

    // Merge stores data back into streaks
    const enrichedData = (data ?? []).map(streak => ({
      ...streak,
      stores: storesMap.get(streak.store_id) ?? null,
    }));

    console.log("[getUserStreaks] 📊 After enriching with stores:", {
      count: enrichedData.length,
      records: enrichedData.map(s => ({
        id: s.id,
        store_id: s.store_id,
        store_name: s.stores?.name,
        store_active: s.stores?.is_active,
      })),
    });

    // Filter criteria:
    // 1. Store must be active (existing logic)
    // 2. The linked streak program must also be active — this prevents old records
    //    from ended programs (e.g. Program A) from surfacing as the user's current
    //    progress when a new program (Program B) has just started.
    //    Exception: keep completed records regardless of program status so that
    //    completion bonuses remain claimable and audit history is preserved.
    const validStreaks = (enrichedData as unknown as UserStreak[]).filter((streak) => {
      const storeValid = isValidStreakStore(streak);
      const programStatus = streak.store_streaks?.status;
      const isActiveProgram = programStatus === "active";
      const isUserCompleted = streak.status === "completed";
      const passes = storeValid && (isActiveProgram || isUserCompleted);
      
      console.log(`[getUserStreaks] 🔎 Filter check - Store: ${streak.stores?.name ?? "NULL"}`, {
        storeValid,
        programStatus,
        isActiveProgram,
        isUserCompleted,
        passes,
        stores_exists: !!streak.stores,
        stores_status: streak.stores?.status,
        stores_is_active: streak.stores?.is_active,
      });
      
      return passes;
    });

    console.log("[getUserStreaks] 📋 After filtering:", {
      validCount: validStreaks.length,
      filtered: validStreaks.map(s => ({
        id: s.id,
        store_name: s.stores?.name,
        status: s.status,
      })),
    });

    // Map PostGIS location into legacy coordinate props expected by the UI.
    const result = validStreaks.map(streak => ({
      ...streak,
      stores: streak.stores ? withPostGISCoordinates(streak.stores) : undefined
    } as UserStreak));

    console.log("[getUserStreaks] ✨ Final result:", result.length, "streaks returned");
    return result;
  } catch (error) {
    console.error("[getUserStreaks] 💥 Exception:", error);
    return [];
  }
}


export async function getUserStreakByStore(
  userId: string,
  storeId: number,
): Promise<UserStreak | null> {
  if (!storeId || isNaN(storeId)) return null;
  try {
    // Fire ALL 4 queries in parallel — avoids the sequential waterfall where
    // store_feature + store_streaks only start after user_streaks finishes.
    const [
      { data: streakRows, error: streakError },
      { data: store, error: storeError },
      { data: featureRow, error: featureError },
      { data: programRow, error: programError },
    ] = await Promise.all([
      supabase
        .from("user_streaks")
        .select(USER_STREAK_SELECT)
        .eq("user_id", userId)
        .eq("store_id", storeId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("stores")
        .select("id, name, logo, address, status, is_active, location, radius")
        .eq("id", storeId)
        .maybeSingle(),
      supabase
        .from("store_feature")
        .select("streak_enabled")
        .eq("store_id", storeId)
        .maybeSingle(),
      supabase
        .from("store_streaks")
        .select(`
          id,
          title,
          streak_length,
          max_days_cap,
          fixed_points_per_day,
          points_mode,
          starting_points,
          increment_value,
          completion_bonus_points,
          reward_description,
          status,
          start_at,
          end_date
        `)
        .eq("store_id", storeId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (streakError) throw new Error(streakError.message);
    if (storeError) throw new Error(storeError.message);

    // Filter 1: store must be active (existing gate).
    // Filter 2: exclude rows linked to an ended program — an old in-progress
    //   user_streaks row that outlived its program must NOT be returned as the
    //   active streak. Returning it would bring the old program's start_at into
    //   the streak log card, causing current-week circles to incorrectly fall
    //   through to "missed" instead of "pre-program".
    //   Exception: keep "completed" user rows so bonus claims still work.
    const streaks = ((streakRows ?? []) as unknown as UserStreak[]).filter((streak) => {
      if (!isValidStreakStore(streak)) return false;
      const programStatus = streak.store_streaks?.status;
      if (programStatus === "ended" && streak.status !== "completed") return false;
      return true;
    });

    const activeProgramStreak =
      streaks.find((streak) => streak.store_streaks?.status === "active") ??
      streaks.find((streak) => streak.status === "in_progress" && streak.store_streaks?.status !== "ended") ??
      streaks[0];

    if (activeProgramStreak) {
      return {
        ...activeProgramStreak,
        stores: activeProgramStreak.stores ? withPostGISCoordinates(activeProgramStreak.stores) : undefined
      } as UserStreak;
    }

    // No existing streak row — use the eagerly-fetched store_feature + store_streaks results
    if (!store || store.status !== "active" || !store.is_active) {
      return null;
    }

    if (featureError) throw new Error(featureError.message);
    if (programError) throw new Error(programError.message);

    if (featureRow?.streak_enabled !== true || !programRow) {
      return null;
    }

    const normalizedStore = withPostGISCoordinates(store);

    return buildVirtualUserStreak(
      {
        id: Number(store.id),
        name: store.name,
        logo: store.logo,
        address: store.address,
        status: store.status,
        is_active: store.is_active,
        latitude: normalizedStore.latitude,
        longitude: normalizedStore.longitude,
        radius: store.radius,
      },
      programRow as UserStreakProgram,
    );
  } catch (error) {
    console.error("Exception fetching streak by store:", error);
    return null;
  }
}
