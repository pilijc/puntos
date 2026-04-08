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
  };
}

export async function getUserStreaks(userId: string): Promise<UserStreak[]> {
  try {
    const { data, error } = await supabase
      .from("user_streaks")
      .select(`
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
          status
        ),
        stores (
          name,
          logo,
          address,
          status,
          is_active
        )
      `)
      .eq("user_id", userId)
      .gt("streak_days", 0)
      .order("streak_days", { ascending: false });

    if (error) {
      console.error("Error fetching user streaks:", error.message);
      return [];
    }

    // Filter out streaks for stores that are not active
    const validStreaks = (data as unknown as UserStreak[]).filter(
      (streak) => streak.stores?.status === "active" && streak.stores?.is_active
    );

    return validStreaks;
  } catch (error) {
    console.error("Exception fetching user streaks:", error);
    return [];
  }
}
