import { supabase } from "@/supabase/supabase";
import { TxType, TransactionItem, PaginatedTransactionsResult, TypeFilter } from "@/type/store-manager/transaction";

export type { TxType, TransactionItem };

export async function getQRTransactionsForStore(
  storeId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedTransactionsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  const { data: rows, error } = await supabase
    .from("qr_transactions")
    .select("id, user_id, points_earned, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !rows) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const hasMore = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);

  if (pageRows.length === 0) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const userIds = [...new Set(pageRows.map((r: any) => r.user_id).filter(Boolean))];

  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

  return {
    items: pageRows.map((row: any) => ({
      id: `qr-${row.id}`,
      type: "qr" as TxType,
      userId: row.user_id,
      userName: usersMap.get(row.user_id)?.name ?? "Unknown",
      userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
      date: row.created_at,
      detail: `+${row.points_earned ?? 0} pts`,
    })),
    hasMore,
    nextPage: page + 1,
  };
}

export async function getStampActivityForStore(
  storeId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedTransactionsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  const { data: rows, error } = await supabase
    .from("stamp_events")
    .select("id, created_at, user_id, store_id")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !rows) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const hasMore = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);

  if (pageRows.length === 0) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const userIds = [...new Set(pageRows.map((r: any) => r.user_id).filter(Boolean))];

  const [{ data: usersData }, { data: progressData }] = await Promise.all([
    supabase.from("users").select("id, name, avatar_url").in("id", userIds),
    supabase
      .from("stamp_progress")
      .select("user_id, stamps_count, target")
      .eq("store_id", storeId)
      .in("user_id", userIds),
  ]);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));
  const progressMap = new Map((progressData ?? []).map((p: any) => [p.user_id, p]));

  return {
    items: pageRows.map((row: any) => {
      const progress = progressMap.get(row.user_id);
      return {
        id: `stamp-${row.id}`,
        type: "stamp" as TxType,
        userId: row.user_id,
        userName: usersMap.get(row.user_id)?.name ?? "Unknown",
        userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
        date: row.created_at,
        detail: progress ? `${progress.stamps_count}/${progress.target} stamps` : "+1 stamp",
      };
    }),
    hasMore,
    nextPage: page + 1,
  };
}

export async function getStreakActivityForStore(
  storeId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedTransactionsResult> {
  const { data: programs, error: progError } = await supabase
    .from("store_streaks")
    .select("id")
    .eq("store_id", storeId);

  if (progError || !programs || programs.length === 0) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const programIds = programs.map((p: any) => p.id);
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  const { data: rows, error } = await supabase
    .from("user_streaks")
    .select("user_id, store_streak_id, total_earned_days, points_earned, completed_at")
    .in("store_streak_id", programIds)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error || !rows) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const hasMore = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);

  if (pageRows.length === 0) {
    return { items: [], hasMore: false, nextPage: page };
  }

  const userIds = [...new Set(pageRows.map((r: any) => r.user_id).filter(Boolean))];

  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map((usersData ?? []).map((u: any) => [u.id, u]));

  return {
    items: pageRows.map((row: any) => ({
      id: `streak-${row.user_id}-${row.store_streak_id}`,
      type: "streak" as TxType,
      userId: row.user_id,
      userName: usersMap.get(row.user_id)?.name ?? "Unknown",
      userAvatar: usersMap.get(row.user_id)?.avatar_url ?? null,
      date: row.completed_at ?? null,
      detail: `Day ${row.total_earned_days} · +${row.points_earned} pts`,
    })),
    hasMore,
    nextPage: page + 1,
  };
}

export async function getAllTransactionsForStore(storeId: number): Promise<{
  qr: PaginatedTransactionsResult;
  stamp: PaginatedTransactionsResult;
  streak: PaginatedTransactionsResult;
}> {
  const [qr, stamp, streak] = await Promise.all([
    getQRTransactionsForStore(storeId),
    getStampActivityForStore(storeId),
    getStreakActivityForStore(storeId),
  ]);
  return { qr, stamp, streak };
}

export async function getTransactionsPageForStore(
  storeId: number,
  typeFilter: TypeFilter,
  page = 1,
  pageSize = 10
): Promise<PaginatedTransactionsResult> {
  if (typeFilter === "qr") return getQRTransactionsForStore(storeId, page, pageSize);
  if (typeFilter === "stamp") return getStampActivityForStore(storeId, page, pageSize);
  if (typeFilter === "streak") return getStreakActivityForStore(storeId, page, pageSize);

  const [qr, stamp, streak] = await Promise.all([
    getQRTransactionsForStore(storeId, page, pageSize),
    getStampActivityForStore(storeId, page, pageSize),
    getStreakActivityForStore(storeId, page, pageSize),
  ]);

  const merged = [...qr.items, ...stamp.items, ...streak.items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  return {
    items: merged.slice(0, pageSize),
    hasMore: qr.hasMore || stamp.hasMore || streak.hasMore,
    nextPage: page + 1,
  };
}
