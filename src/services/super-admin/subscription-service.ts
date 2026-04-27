import { supabase } from "@/supabase/supabase";
import type {
  ManagerSubscriptionRow,
  ManagerSubscriptionPaymentRow,
  PublicUserRow,
  SubscriptionDashboardCompare,
  SubscriptionDashboardStats,
  SubscriptionPlan,
} from "@/type/super-admin/subscription";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
    .from("subscriptions")
    .select("*");

    if (error) throw new Error(error.message);
    return (data ?? []) as SubscriptionPlan[];
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Failed to load subscription plans: ${e.message}` : "Failed to load subscription plans.",
    );
  }
}

export async function updateProSubscriptionAmount(amount: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ amount })
      .eq("slug", "pro");

    if (error) throw new Error(error.message);
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Failed to update Pro amount: ${e.message}` : "Failed to update Pro amount.",
    );
  }
}

export async function getManagerSubscriptions() {
  try {
    const { data, error } = await supabase
    .from("manager_subscriptions")
    .select("*");

    if (error) throw new Error(error.message);
    return (data ?? []) as ManagerSubscriptionRow[];
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `Failed to load manager subscriptions: ${e.message}`
        : "Failed to load manager subscriptions.",
    );
  }
}

export async function getPublicUsersByIds(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id,email,name")
      .in("id", ids);

    if (error) throw new Error(error.message);
    return (data ?? []) as PublicUserRow[];
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Failed to load users: ${e.message}` : "Failed to load users.",
    );
  }
}

export async function getTotalAmountCollected(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("manager_subscription_payments")
      .select("amount_paid")
      .eq("payment_status", "paid");

    if (error) throw new Error(error.message);
    return (data ?? []).reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0);
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Failed to load total collected: ${e.message}` : "Failed to load total collected.",
    );
  }
}


function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function paymentEventTime(row: { paid_at?: string | null; created_at?: string | null }): number | null {
  return parseTime(row.paid_at) ?? parseTime(row.created_at);
}

function thisMonthVsComparableLastMonthRange(nowInput = new Date()) {
  const y = nowInput.getFullYear();
  const m = nowInput.getMonth();
  const thisMonthStart = new Date(y, m, 1).getTime();
  const now = nowInput.getTime();
  const lastMonthStart = new Date(y, m - 1, 1).getTime();
  const endOfLastMonth = new Date(y, m, 0, 23, 59, 59, 999).getTime();
  const elapsed = now - thisMonthStart;
  const lastMonthCompareEnd = Math.min(lastMonthStart + elapsed, endOfLastMonth);
  return {
    thisStart: thisMonthStart,
    thisEnd: now,
    lastStart: lastMonthStart,
    lastEnd: lastMonthCompareEnd,
  };
}

function compareVersusLastMonth(current: number, previous: number): SubscriptionDashboardCompare {
  if (previous === 0) {
    if (current === 0) return { trend: "flat", subtitle: "Same as last month" };
    return { trend: "up", subtitle: "100% last month" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { trend: "flat", subtitle: "Same as last month" };
  if (pct > 0) return { trend: "up", subtitle: `${pct}% last month` };
  return { trend: "down", subtitle: `${Math.abs(pct)}% last month` };
}

export async function getSubscriptionDashboardStats(
  managerSubscriptions: ManagerSubscriptionRow[],
): Promise<SubscriptionDashboardStats> {
  try {
    const { data, error } = await supabase
      .from("manager_subscription_payments")
      .select("amount_paid, paid_at, created_at")
      .eq("payment_status", "paid");

    if (error) throw new Error(error.message);

    const range = thisMonthVsComparableLastMonthRange(new Date());
    const { thisStart, thisEnd, lastStart, lastEnd } = range;

    let totalAmountCollected = 0;
    let paidThisMonth = 0;
    let paidLastMonthComparable = 0;

    for (const row of data ?? []) {
      const amt = Number(row.amount_paid ?? 0);
      totalAmountCollected += amt;
      const t = paymentEventTime(row);
      if (t == null) continue;
      if (t >= thisStart && t <= thisEnd) paidThisMonth += amt;
      else if (t >= lastStart && t <= lastEnd) paidLastMonthComparable += amt;
    }

    /** % compares this month-to-date paid revenue vs the same calendar span last month (not the all-time headline). */
    const totalAmountCollectedCompare = compareVersusLastMonth(paidThisMonth, paidLastMonthComparable);

    let activeSubscribers = 0;
    let paidUpdatedThisMonth = 0;
    let paidUpdatedLastMonth = 0;
    let newThisMonth = 0;
    let newLastMonthComparable = 0;
    let scheduledCancellations = 0;
    let scheduledMarkedThisMonth = 0;
    let scheduledMarkedLastMonth = 0;

    for (const s of managerSubscriptions) {
      const paid = String(s.payment_status ?? "").toLowerCase() === "paid";
      if (paid) activeSubscribers += 1;

      const updated = parseTime(s.updated_at);
      if (paid && updated != null) {
        if (updated >= thisStart && updated <= thisEnd) paidUpdatedThisMonth += 1;
        else if (updated >= lastStart && updated <= lastEnd) paidUpdatedLastMonth += 1;
      }

      const created = parseTime(s.created_at);
      if (paid && created != null) {
        if (created >= thisStart && created <= thisEnd) newThisMonth += 1;
        else if (created >= lastStart && created <= lastEnd) newLastMonthComparable += 1;
      }

      if (Boolean(s.cancel_at_period_end)) {
        scheduledCancellations += 1;
        if (updated != null) {
          if (updated >= thisStart && updated <= thisEnd) scheduledMarkedThisMonth += 1;
          else if (updated >= lastStart && updated <= lastEnd) scheduledMarkedLastMonth += 1;
        }
      }
    }

    /**
     * We do not store historical “active headcount”; the footer compares how many **paid** rows had
     * `updated_at` in each window (renewals, status changes, etc.) as a lightweight activity signal.
     */
    const activeSubscribersCompare = compareVersusLastMonth(paidUpdatedThisMonth, paidUpdatedLastMonth);

    return {
      totalAmountCollected,
      totalAmountCollectedCompare,
      activeSubscribers,
      activeSubscribersCompare,
      newSubscribersThisMonth: newThisMonth,
      newSubscribersThisMonthCompare: compareVersusLastMonth(newThisMonth, newLastMonthComparable),
      scheduledCancellations,
      scheduledCancellationsCompare: compareVersusLastMonth(
        scheduledMarkedThisMonth,
        scheduledMarkedLastMonth,
      ),
    };
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `Failed to load subscription dashboard stats: ${e.message}`
        : "Failed to load subscription dashboard stats.",
    );
  }
}

export async function getManagerSubscriptionPaymentsByOwner(ownerId: string) {
  try {

    const { data, error } = await supabase
      .from("manager_subscription_payments")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `Failed to load payments ledger: ${e.message}`
        : "Failed to load payments ledger."
    );
  }
}