import { supabase } from "@/supabase/supabase";
import { Streak, StreakParticipant } from "@/type/store-manager/streak";
import {
  assertStoreOwnerCanManagePremiumCampaigns,
  getStoreOwnerId,
  ownerCanManagePremiumCampaigns,
} from "@/services/store-manager/premium-campaign-gate";
import { computeEndDateFromStartIso, computeMinStartAtFromActiveProgram } from "@/utils/store_manager/streak-utils";

async function syncAutoActivateStreaks(storeId: string): Promise<void> {
  const ownerId = await getStoreOwnerId(storeId);
  const allowed = await ownerCanManagePremiumCampaigns(ownerId);
  if (!allowed) return;

  const { error } = await supabase.rpc("activate_due_store_streaks", {
    target_store_id: Number(storeId),
  });

  if (error) return;
}

export async function createStreak(payload: Streak): Promise<void> {
  try {
    await assertStoreOwnerCanManagePremiumCampaigns(payload.store_id);

    const { error } = await supabase
      .from("store_streaks")
      .insert(payload);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw error;
  }
}

export async function getStreakProgramById(programId: number): Promise<Streak | null> {
  try {
    const { data, error } = await supabase
      .from("store_streaks")
      .select("*")
      .eq("id", programId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as Streak | null;
  } catch (error) {
    throw error;
  }
}

export async function updateStreakProgram(programId: number, payload: Partial<Streak>): Promise<void> {
  try {
    const row = await getStreakProgramById(programId);
    if (!row?.store_id) throw new Error("Streak program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(row.store_id);

    const { error } = await supabase
      .from("store_streaks")
      .update(payload)
      .eq("id", programId);
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

async function getActiveStreakForStore(storeId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from("store_streaks")
    .select("id, store_id, start_at, end_date, streak_length")
    .eq("store_id", storeId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Streak | null;
}


export async function publishStreakProgram(programId: number): Promise<void> {
  try {
    const row = await getStreakProgramById(programId);
    if (!row?.store_id) throw new Error("Streak program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(row.store_id);

    if (row.status !== "draft") {
      throw new Error("Only draft programs can be published.");
    }

    if (row.start_at) {
      const { error } = await supabase
        .from("store_streaks")
        .update({ status: "upcoming", updated_at: new Date().toISOString() })
        .eq("id", programId)
        .eq("status", "draft");
      if (error) throw new Error(error.message);
      return;
    }

    const activeOther = await getActiveStreakForStore(String(row.store_id));
    const minStart = computeMinStartAtFromActiveProgram(activeOther ?? undefined);
    const startAtMs = Math.max(Date.now(), minStart.getTime());
    const startIso = new Date(startAtMs).toISOString();
    const endDate = computeEndDateFromStartIso(startIso, row.max_days_cap ?? null);

    if (!activeOther) {
      const { error } = await supabase
        .from("store_streaks")
        .update({
          status: "active",
          start_at: startIso,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", programId)
        .eq("status", "draft");
      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase
      .from("store_streaks")
      .update({
        status: "upcoming",
        start_at: startIso,
        end_date: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", programId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error("Failed to publish the streak program. Please try again later.");
  }
}

export async function activateStreakProgram(programId: number): Promise<void> {
  try {
    const row = await getStreakProgramById(programId);
    if (!row?.store_id) throw new Error("Streak program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(row.store_id);

    if (row.status !== "upcoming") {
      throw new Error("Only upcoming programs can be activated manually.");
    }

    const startIso = new Date().toISOString();
    const endDate = computeEndDateFromStartIso(startIso, row.max_days_cap ?? null);

    const { error } = await supabase
      .from("store_streaks")
      .update({
        status: "active",
        start_at: startIso,
        end_date: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", programId)
      .eq("status", "upcoming");
    if (error) {
      if (error.code === "23505") {
        throw new Error("There is already an active streak program for this store. End the current active program before activating another.");
      }
      throw new Error("Couldn't activate this streak program. Please try again.");
 
    }
  } catch (error) {
    throw new Error("Failed to activate the streak program. Please try again later.");
  }
}

export async function endStreakProgram(programId: number): Promise<void> {
  try {
    const row = await getStreakProgramById(programId);
    if (!row?.store_id) throw new Error("Streak program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(row.store_id);

    const now = new Date();
    const { error } = await supabase
      .from("store_streaks")
      .update({ status: "ended", ended_at: now.toISOString() })
      .eq("id", programId);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error("Failed to end the streak program. Please try again later.");
  }
}

export async function deleteStreakProgram(programId: number): Promise<void> {
  try {
    const row = await getStreakProgramById(programId);
    if (!row?.store_id) throw new Error("Streak program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(row.store_id);

    const { error } = await supabase
      .from("store_streaks")
      .delete()
      .eq("id", programId);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error("Failed to delete the streak program. Please try again later.");
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
    throw new Error("Failed to get participants count for the streak program. Please try again later.");
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
    throw new Error("Failed to get participants for the streak program. Please try again later.");
  }
}
