import { supabase } from "@/supabase/supabase";

export interface RecordStreakResult {
  alreadyRecorded: boolean;
  newStreakDays: number;
  pointsEarned: number;
  /** true when this call pushed the user to exactly streakLength (just completed) */
  justCompleted: boolean;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function recordUserStreak(
  userId: string,
  storeId: number,
  storeStreakId: number,
  pointsPerDay: number = 0,
  streakLength: number = 0,
): Promise<RecordStreakResult> {
  const d = new Date();
  const today = formatLocalDate(d);
  d.setDate(d.getDate() - 1);
  const yesterday = formatLocalDate(d);

  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("store_streak_id", storeStreakId)
    .maybeSingle();

  if (existing) {
    // BLOCKER: Already earned today — no double-dipping
    if (existing.last_activity_date === today) {
      return { alreadyRecorded: true, newStreakDays: existing.streak_days, pointsEarned: 0, justCompleted: false };
    }

    // BLOCKER: Already completed the streak program — cannot earn more days
    const currentTotal = existing.total_earned_days ?? 0;
    if (streakLength > 0 && currentTotal >= streakLength) {
      return { alreadyRecorded: true, newStreakDays: existing.streak_days, pointsEarned: 0, justCompleted: false };
    }

    const isConsecutive = existing.last_activity_date === yesterday;
    const newStreakDays = isConsecutive ? existing.streak_days + 1 : 1;
    const newTotalEarned = currentTotal + 1;
    const newPointsEarned = Number(existing.points_earned ?? 0) + pointsPerDay;

    // Mark as completed when the user hits exactly the target
    const justCompleted = streakLength > 0 && newTotalEarned >= streakLength;
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("user_streaks")
      .update({
        streak_days: newStreakDays,
        last_activity_date: today,
        total_earned_days: newTotalEarned,
        points_earned: newPointsEarned,
        updated_at: nowIso,
        ...(justCompleted && {
          status: "completed",
          completed_at: nowIso,
        }),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);

    // Log the individual earned day — UNIQUE constraint prevents duplicates
    await supabase.from("streak_events").insert({
      user_id: userId,
      store_id: storeId,
      user_streak_id: existing.id,
      store_streak_id: storeStreakId,
      earned_date: today,
    });

    return { alreadyRecorded: false, newStreakDays, pointsEarned: pointsPerDay, justCompleted };
  }

  // New record — first ever streak for this store
  // Edge-case: if streakLength is 1, it's immediately completed
  const justCompleted = streakLength > 0 && streakLength <= 1;
  const nowIso = new Date().toISOString();

  const { error, data: inserted } = await supabase
    .from("user_streaks")
    .insert({
      user_id: userId,
      store_id: storeId,
      store_streak_id: storeStreakId,
      streak_days: 1,
      last_activity_date: today,
      total_earned_days: 1,
      points_earned: pointsPerDay,
      status: justCompleted ? "completed" : "in_progress",
      ...(justCompleted && { completed_at: nowIso }),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Log the first earned day for this streak
  if (inserted?.id) {
    await supabase.from("streak_events").insert({
      user_id: userId,
      store_id: storeId,
      user_streak_id: inserted.id,
      store_streak_id: storeStreakId,
      earned_date: today,
    });
  }

  return { alreadyRecorded: false, newStreakDays: 1, pointsEarned: pointsPerDay, justCompleted };
}

/**
 * Fetch all earned dates from streak_events for a given user + store.
 * Returns a Set of "YYYY-MM-DD" strings in the user's LOCAL timezone.
 * Used by the activity calendar so it shows real per-day history.
 */
export async function getStreakEarnedDates(
  userId: string,
  storeId: number,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("streak_events")
    .select("earned_date")
    .eq("user_id", userId)
    .eq("store_id", storeId)
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
  stores?: {
    name: string;
    logo?: string;
    address?: string;
    status: string;
    is_active: boolean;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number | null;
  };
}

const USER_STREAK_SELECT = `
  *,
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
  stores (
    name,
    logo,
    address,
    status,
    is_active,
    latitude,
    longitude,
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
    const { data, error } = await supabase
      .from("user_streaks")
      .select(USER_STREAK_SELECT)
      .eq("user_id", userId)
      .gt("streak_days", 0)
      .order("streak_days", { ascending: false });

    if (error) {
      console.error("Error fetching user streaks:", error.message);
      return [];
    }

    // Filter criteria:
    // 1. Store must be active (existing logic)
    // 2. The linked streak program must also be active — this prevents old records
    //    from ended programs (e.g. Program A) from surfacing as the user's current
    //    progress when a new program (Program B) has just started.
    //    Exception: keep completed records regardless of program status so that
    //    completion bonuses remain claimable and audit history is preserved.
    const validStreaks = (data as unknown as UserStreak[]).filter((streak) => {
      if (!isValidStreakStore(streak)) return false;
      const programStatus = streak.store_streaks?.status;
      // Keep if: program is still active OR the user already completed this streak
      const isActiveProgram = programStatus === "active";
      const isUserCompleted = streak.status === "completed";
      return isActiveProgram || isUserCompleted;
    });

    return validStreaks;
  } catch (error) {
    console.error("Exception fetching user streaks:", error);
    return [];
  }
}


export async function getUserStreakByStore(
  userId: string,
  storeId: number,
): Promise<UserStreak | null> {
  try {
    const [{ data: streakRows, error: streakError }, { data: store, error: storeError }] =
      await Promise.all([
        supabase
          .from("user_streaks")
          .select(USER_STREAK_SELECT)
          .eq("user_id", userId)
          .eq("store_id", storeId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("stores")
          .select("id, name, logo, address, status, is_active, latitude, longitude, radius")
          .eq("id", storeId)
          .maybeSingle(),
      ]);

    if (streakError) throw new Error(streakError.message);
    if (storeError) throw new Error(storeError.message);

    const streaks = ((streakRows ?? []) as unknown as UserStreak[]).filter((streak) =>
      isValidStreakStore(streak),
    );

    const activeProgramStreak =
      streaks.find((streak) => streak.store_streaks?.status === "active") ??
      streaks.find((streak) => streak.status === "in_progress") ??
      streaks[0];

    if (activeProgramStreak) {
      return activeProgramStreak;
    }

    if (!store || store.status !== "active" || !store.is_active) {
      return null;
    }

    const [{ data: featureRow, error: featureError }, { data: programRow, error: programError }] =
      await Promise.all([
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

    if (featureError) throw new Error(featureError.message);
    if (programError) throw new Error(programError.message);

    if (featureRow?.streak_enabled !== true || !programRow) {
      return null;
    }

    return buildVirtualUserStreak(
      {
        id: Number(store.id),
        name: store.name,
        logo: store.logo,
        address: store.address,
        status: store.status,
        is_active: store.is_active,
        latitude: store.latitude,
        longitude: store.longitude,
        radius: store.radius,
      },
      programRow as UserStreakProgram,
    );
  } catch (error) {
    console.error("Exception fetching streak by store:", error);
    return null;
  }
}
