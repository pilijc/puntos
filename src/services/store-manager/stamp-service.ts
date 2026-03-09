import { supabase } from "@/supabase/supabase";
import { Stamp } from "@/type/store-manager/stamp";

export type ProgramStatus = "active" | "ended_grace" | "ended_expired";

export function getProgramStatus(stamp: Stamp): ProgramStatus {
  if (stamp.is_active) return "active";
  const now = new Date();
  if (stamp.redemption_deadline && now < new Date(stamp.redemption_deadline)) {
    return "ended_grace";
  }
  return "ended_expired";
}

export async function getActiveStampProgram(storeId: string): Promise<Stamp | null> {
  const { data, error } = await supabase
    .from("store_stamps")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Stamp | null;
}

export async function getAllStampsByStoreId(storeId: string): Promise<Stamp[]> {
  const { data, error } = await supabase
    .from("store_stamps")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Stamp[];
}

export async function createStamp(payload: Omit<Stamp, "id" | "is_active" | "ended_at" | "redemption_deadline" | "created_at">): Promise<void> {
  const active = await getActiveStampProgram(payload.store_id);
  if (active) {
    throw new Error("There is already an active stamp program for this store. End the current program before creating a new one.");
  }

  const { error } = await supabase
    .from("store_stamps")
    .insert({
      ...payload,
      is_active: true,
    });

  if (error) throw new Error(error.message);
}

export async function endStampProgram(programId: number, graceDays: number): Promise<void> {
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
}

export async function getStampByStoreId(storeId: string): Promise<Stamp | null> {
  return getActiveStampProgram(storeId);
}

export interface StampCollector {
  user_id: string;
  stamps_count: number;
  target: number;
  last_stamp_at: string;
  updated_at: string;
  card_status: "active" | "completed" | "expired";
  card_expires_at: string | null;
  users: {
    name: string;
    avatar_url?: string;
  } | null;
}

export async function getCollectorsByProgramId(programId: number): Promise<StampCollector[]> {
  try {
    const { data: progressRows, error: progressError } = await supabase
      .from("stamp_progress")
      .select("user_id, stamps_count, target, last_stamp_at, updated_at, card_status, card_expires_at")
      .eq("stamp_program_id", programId)
      .order("stamps_count", { ascending: false });

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

/** @deprecated Use getCollectorsByProgramId instead */
export async function getStampCollectorsByStoreId(storeId: string): Promise<StampCollector[]> {
  return [];
}
