import { supabase } from "@/supabase/supabase";

export interface UserStreak {
  id: number;
  user_id: string;
  store_id: number;
  streak_days: number;
  last_activity_date: string;
  stores?: {
    name: string;
    logo?: string;
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
        stores (
          name,
          logo,
          status,
          is_active
        )
      `)
      .eq("user_id", userId)
      .gt("streak_days", 0) // Only active streaks
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
