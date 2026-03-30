import { supabase } from "@/supabase/supabase";

export interface RecordStreakResult {
  alreadyRecorded: boolean;
  newStreakDays: number;
  pointsEarned: number;
}

export async function recordUserStreak(
  userId: string,
  storeId: number,
  storeStreakId: number,
  pointsPerDay: number = 0,
): Promise<RecordStreakResult> {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("store_streak_id", storeStreakId)
    .maybeSingle();

  if (existing) {
    // Already earned today
    if (existing.last_activity_date === today) {
      return { alreadyRecorded: true, newStreakDays: existing.streak_days, pointsEarned: 0 };
    }

    const isConsecutive = existing.last_activity_date === yesterday;
    const newStreakDays = isConsecutive ? existing.streak_days + 1 : 1;
    const newTotalEarned = (existing.total_earned_days ?? 0) + 1;
    const newPointsEarned = Number(existing.points_earned ?? 0) + pointsPerDay;

    const { error } = await supabase
      .from("user_streaks")
      .update({
        streak_days: newStreakDays,
        last_activity_date: today,
        total_earned_days: newTotalEarned,
        points_earned: newPointsEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    return { alreadyRecorded: false, newStreakDays, pointsEarned: pointsPerDay };
  }

  // New record — first ever streak for this store
  const { error } = await supabase
    .from("user_streaks")
    .insert({
      user_id: userId,
      store_id: storeId,
      store_streak_id: storeStreakId,
      streak_days: 1,
      last_activity_date: today,
      total_earned_days: 1,
      points_earned: pointsPerDay,
      status: "in_progress",
    });

  if (error) throw new Error(error.message);
  return { alreadyRecorded: false, newStreakDays: 1, pointsEarned: pointsPerDay };
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

    // Filter out streaks for stores that are not active
    const validStreaks = (data as unknown as UserStreak[]).filter(
      (streak) => isValidStreakStore(streak)
    );

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
