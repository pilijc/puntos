import { supabase } from "@/supabase/supabase";
import { TxType, TransactionItem } from "@/type/store-manager/transaction";

export type { TxType, TransactionItem };

export async function getQRTransactionsForStore(storeId: number): Promise<TransactionItem[]> {
  const { data: rows, error } = await supabase
    .from("qr_transactions")
    .select("id, user_id, points_earned, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !rows || rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r: any) => r.user_id))];
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

  return rows.map((row: any) => ({
    id: `qr-${row.id}`,
    type: "qr" as TxType,
    userId: row.user_id,
    userName: usersMap.get(row.user_id)?.name ?? "Unknown",
    userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
    date: row.created_at,
    detail: `+${row.points_earned ?? 0} pts`,
  }));
}

export async function getStampActivityForStore(storeId: number): Promise<TransactionItem[]> {
  const { data: rows, error } = await supabase
    .from("stamp_events")
    .select("id, created_at, user_id, store_id")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !rows || rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r: any) => r.user_id))];

  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

  const { data: progressData } = await supabase
    .from("stamp_progress")
    .select("user_id, stamps_count, target")
    .eq("store_id", storeId)
    .in("user_id", userIds);

  const progressMap = new Map((progressData ?? []).map((p: any) => [p.user_id, p]));

  return rows.map((row: any) => {
    const progress = progressMap.get(row.user_id);
    const detail = progress
      ? `${progress.stamps_count}/${progress.target} stamps`
      : "+1 stamp";

    return {
      id: `stamp-${row.id}`,
      type: "stamp" as TxType,
      userId: row.user_id,
      userName: usersMap.get(row.user_id)?.name ?? "Unknown",
      userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
      date: row.created_at,
      detail,
    };
  });
}

export async function getStreakActivityForStore(storeId: number): Promise<TransactionItem[]> {
  const { data: programs, error: progError } = await supabase
    .from("store_streaks")
    .select("id")
    .eq("store_id", storeId);

  if (progError || !programs || programs.length === 0) return [];

  const programIds = programs.map((p: any) => p.id);

  const { data: rows, error } = await supabase
    .from("user_streaks")
    .select("user_id, store_streak_id, total_earned_days, points_earned, completed_at")
    .in("store_streak_id", programIds)
    .order("points_earned", { ascending: false })
    .limit(100);

  if (error || !rows || rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r: any) => r.user_id))];
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

  return rows.map((row: any) => ({
    id: `streak-${row.user_id}-${row.store_streak_id}`,
    type: "streak" as TxType,
    userId: row.user_id,
    userName: usersMap.get(row.user_id)?.name ?? "Unknown",
    userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
    date: row.completed_at ?? null,
    detail: `Day ${row.total_earned_days} · +${row.points_earned} pts`,
  }));
}

export async function getAllTransactionsForStore(storeId: number): Promise<{
  qr: TransactionItem[];
  stamp: TransactionItem[];
  streak: TransactionItem[];
}> {
  const [qr, stamp, streak] = await Promise.all([
    getQRTransactionsForStore(storeId),
    getStampActivityForStore(storeId),
    getStreakActivityForStore(storeId),
  ]);
  return { qr, stamp, streak };
}
