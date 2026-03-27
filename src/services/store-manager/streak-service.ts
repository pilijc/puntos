import { supabase } from "@/supabase/supabase";
import { Streak, StreakParticipant } from "@/type/store-manager/streak";

async function syncAutoActivateStreaks(storeId: string): Promise<void> {
  const { error } = await supabase.rpc("activate_due_store_streaks", {
    target_store_id: Number(storeId),
  });

  if (error) return;
}

export async function createStreak(payload: Streak): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_streaks")
      .insert(payload);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw error;
  }
}

export async function getAllStreaksByStoreId(storeId: string): Promise<Streak[]> {
  try {
    await syncAutoActivateStreaks(storeId);
    const { data, error } = await supabase
      .from("store_streaks")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Streak[];
  } catch (error) {
    throw error;
  }
}

export async function publishStreakProgram(programId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_streaks")
      .update({ status: "upcoming" })
      .eq("id", programId);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw error;
  }
}

export async function activateStreakProgram(programId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_streaks")
      .update({ status: "active" })
      .eq("id", programId);
    if (error) {
      if (error.code === "23505") {
        throw new Error("There is already an active streak program for this store. End the current active program before activating another.");
      }
      throw new Error(error.message);
    }
  } catch (error) {
    throw error;
  }
}

export async function endStreakProgram(programId: number): Promise<void> {
  try {
    const now = new Date();
    const { error } = await supabase
      .from("store_streaks")
      .update({ status: "ended", ended_at: now.toISOString() })
      .eq("id", programId);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw error;
  }
}

export async function getParticipantsCountByProgramId(programId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("user_streaks")
      .select("*", { count: "exact", head: true })
      .eq("store_streak_id", programId);
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (error) {
    throw error;
  }
}

export async function getParticipantsByProgramId(
  programId: number,
  page = 0,
  pageSize = 5,
): Promise<StreakParticipant[]> {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: rows, error: rowsError } = await supabase
      .from("user_streaks")
      .select("user_id, store_streak_id, total_earned_days, points_earned, completion_bonus_awarded, completed_at, status")
      .eq("store_streak_id", programId)
      .order("points_earned", { ascending: false })
      .range(from, to);

    if (rowsError) throw new Error(rowsError.message);
    if (!rows || rows.length === 0) return [];

    const userIds = rows.map((r: any) => r.user_id);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .in("id", userIds);

    if (usersError) throw new Error(usersError.message);

    const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

    return rows.map((row: any) => ({
      ...row,
      users: usersMap.get(row.user_id) ?? null,
    })) as StreakParticipant[];
  } catch (error) {
    throw error;
  }
}
