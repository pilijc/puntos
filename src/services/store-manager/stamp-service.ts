import { supabase } from "@/supabase/supabase";
import { ProgramStatus, Stamp, StampCollector } from "@/type/store-manager/stamp";
import { assertStoreOwnerCanManagePremiumCampaigns } from "@/services/store-manager/premium-campaign-gate";


export function getProgramStatus(stamp: Stamp): ProgramStatus {
  if (stamp.status === "active") return "active";
  if (stamp.status === "draft") return "draft";
  const now = new Date();
  if (stamp.redemption_deadline && now < new Date(stamp.redemption_deadline)) {
    return "ended_grace";
  }
  if (stamp.created_at && stamp.expiration_days != null) {
    const createdAt = new Date(stamp.created_at);
    const expiredAt = new Date(
      createdAt.getTime() + Number(stamp.expiration_days) * 24 * 60 * 60 * 1000,
    );
    if (now <= expiredAt) {
      return "ended_expired";
    }
  }
  return "ended";
}

export async function getActiveStampProgram(storeId: string): Promise<Stamp | null> {
  try {
    const { data, error } = await supabase
    .from("store_stamps")
    .select("*")
    .eq("store_id", storeId)  
    .eq("status", "active")
    .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Stamp | null;
  } catch (error) {
    console.error("Error in getActiveStampProgram:", error);
    throw error;
  }
}

export async function getAllStampsByStoreId(storeId: string): Promise<Stamp[]> {
  try {
    const { data, error } = await supabase
      .from("store_stamps")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Stamp[];
  } catch (error) {
    console.error("Error in getAllStampsByStoreId:", error);
    throw error;
  }
}

/** True if any stamp program for the store uses this store reward as its completion reward. */
export async function isStoreRewardLinkedToStampProgram(
  storeId: string,
  rewardId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("store_stamps")
    .select("id")
    .eq("store_id", storeId)
    .eq("reward_id", rewardId)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function createStamp(payload: Omit<Stamp, "id" | "status" | "ended_at" | "redemption_deadline" | "created_at">): Promise<void> {
  try {
    await assertStoreOwnerCanManagePremiumCampaigns(payload.store_id);

    const { error } = await supabase
      .from("store_stamps")
      .insert({
        ...payload,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in createStamp:", error);
    throw error;
  }
}

export async function getStampProgramById(programId: number): Promise<Stamp | null> {
  try {
    const { data, error } = await supabase
      .from("store_stamps")
      .select("*")
      .eq("id", programId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as Stamp | null;
  } catch (error) {
    console.error("Error in getStampProgramById:", error);
    throw error;
  }
}

export async function updateStampProgram(
  programId: number,
  payload: Pick<Stamp, "total_stamps" | "reward_id" | "expiration_mode" | "expiration_days">,
): Promise<void> {
  try {
    const program = await getStampProgramById(programId);
    if (!program?.store_id) throw new Error("Stamp program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(program.store_id);

    const { error } = await supabase
      .from("store_stamps")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", programId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in updateStampProgram:", error);
    throw error;
  }
}

export async function endStampProgram(programId: number, graceDays: number): Promise<void> {
  try {
    const program = await getStampProgramById(programId);
    if (!program?.store_id) throw new Error("Stamp program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(program.store_id);

    const now = new Date();
    const redemptionDeadline = new Date(now);
    redemptionDeadline.setDate(redemptionDeadline.getDate() + graceDays);

    const { error } = await supabase
      .from("store_stamps")
      .update({
        status: "ended",
        ended_at: now.toISOString(),
        redemption_deadline: graceDays > 0 ? redemptionDeadline.toISOString() : null,
      })
      .eq("id", programId);

    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in endStampProgram:", error);
    throw error;
  }
}

export async function activateStampProgram(programId: number): Promise<void> {
  try {
    const program = await getStampProgramById(programId);
    if (!program?.store_id) throw new Error("Stamp program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(program.store_id);

    const { error } = await supabase
      .from("store_stamps")
      .update({
        status: "active",
        ended_at: null,
        redemption_deadline: null,
      })
      .eq("id", programId);

    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in activateStampProgram:", error);
    throw error;
  }
}

export async function getStampByStoreId(storeId: string): Promise<Stamp | null> {
  return getActiveStampProgram(storeId);
}

export async function getCollectorsCountByProgramId(programId: number): Promise<number> {
  try {
    const { count, error } = await supabase
    .from("stamp_progress")
    .select("*", { count: "exact", head: true })
    .eq("stamp_program_id", programId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (error) {
    console.error("Error in getCollectorsCountByProgramId:", error);
    throw error;
  }
}

export async function getCollectorsByProgramId(
  programId: number,
  page = 0,
  pageSize = 5,
): Promise<StampCollector[]> {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: progressRows, error: progressError } = await supabase
      .from("stamp_progress")
      .select("user_id, stamps_count, target, last_stamp_at, updated_at, card_status, card_expires_at")
      .eq("stamp_program_id", programId)
      .order("stamps_count", { ascending: false })
      .range(from, to);

    if (progressError) throw new Error(progressError.message);
    if (!progressRows || progressRows.length === 0) return [];

    type ProgressRow = Omit<StampCollector, "users">;
    type UserRow = { id: string; name: string; avatar_url?: string };

    const typedProgressRows = progressRows as unknown as ProgressRow[];
    const userIds = typedProgressRows.map((r) => r.user_id);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .in("id", userIds);

    if (usersError) throw new Error(usersError.message);

    const usersMap = new Map(
      ((usersData ?? []) as UserRow[]).map((u) => [u.id, u]),
    );

    return typedProgressRows.map((row) => ({
      ...row,
      users: usersMap.get(row.user_id) ?? null,
    })) as StampCollector[];
  } catch (error) {
    console.error("Error in getCollectorsByProgramId:", error);
    throw error;
  }
}

export async function deleteStampProgram(programId: number): Promise<void> {
  try {
    const program = await getStampProgramById(programId);
    if (!program?.store_id) throw new Error("Stamp program not found.");
    await assertStoreOwnerCanManagePremiumCampaigns(program.store_id);

    const { error } = await supabase
      .from("store_stamps")
      .delete()
      .eq("id", programId);
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in deleteStampProgram:", error);
    throw error;
  }
}

export async function getStampCollectorsByStoreId(storeId: string): Promise<StampCollector[]> {
  return [];
}
