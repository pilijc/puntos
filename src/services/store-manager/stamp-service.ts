import { supabase } from "@/supabase/supabase";
import { ProgramStatus, Stamp, StampCollector } from "@/type/store-manager/stamp";


export function getProgramStatus(stamp: Stamp): ProgramStatus {
  if (stamp.status === "active") return "active";
  const now = new Date();
  if (stamp.redemption_deadline && now < new Date(stamp.redemption_deadline)) {
    return "ended_grace";
  }
  return "ended_expired";
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

export async function createStamp(payload: Omit<Stamp, "id" | "status" | "ended_at" | "redemption_deadline" | "created_at">): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_stamps")
      .insert({
        ...payload,
        status: "draft",
      });

    if (error) throw new Error(error.message);

    const { data: existingFeature, error: featureReadError } = await supabase
      .from("store_feature")
      .select("streak_enabled, reward_enabled")
      .eq("store_id", payload.store_id)
      .maybeSingle();

    if (featureReadError) {
      throw new Error(featureReadError.message);
    }

    const { error: featureUpsertError } = await supabase
      .from("store_feature")
      .upsert(
        {
          store_id: payload.store_id,
          streak_enabled: existingFeature?.streak_enabled ?? false,
          stamp_enabled: true,
          reward_enabled: existingFeature?.reward_enabled ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );

    if (featureUpsertError) {
      throw new Error(featureUpsertError.message);
    }
  } catch (error) {
    console.error("Error in createStamp:", error);
    throw error;
  }
}

export async function endStampProgram(programId: number, graceDays: number): Promise<void> {
  try {
    const now = new Date();
    const redemptionDeadline = new Date(now);
    redemptionDeadline.setDate(redemptionDeadline.getDate() + graceDays);

    const { error } = await supabase
      .from("store_stamps")
      .update({
        is_active: false,
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

    const userIds = progressRows.map((r: any) => r.user_id);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .in("id", userIds);

    if (usersError) throw new Error(usersError.message);

    const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

    return progressRows.map((row: any) => ({
      ...row,
      users: usersMap.get(row.user_id) ?? null,
    })) as StampCollector[];
  } catch (error) {
    console.error("Error in getCollectorsByProgramId:", error);
    throw error;
  }
}

export async function getStampCollectorsByStoreId(storeId: string): Promise<StampCollector[]> {
  return [];
}
