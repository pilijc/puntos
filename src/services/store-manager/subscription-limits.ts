import { supabase } from "@/supabase/supabase";

/**
 * Count stores owned by this user that count toward the Basic limit (pending review + active).
 */
export async function countOwnerStoreSlotsUsed(ownerId: string): Promise<number> {
  const { count, error } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .in("status", ["pending_review", "active"]);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

function planSlugForSubscription(
  plans: Array<{ id: number; slug?: string | null }>,
  subscriptionId: number | null,
): string | null {
  if (subscriptionId == null) return null;
  const row = plans.find((p) => Number(p.id) === Number(subscriptionId));
  return row?.slug ? String(row.slug).toLowerCase() : null;
}

/**
 * Paid tier = payment completed and plan is not Basic (e.g. pro / premium).
 */
export function isPaidUnlimitedPlan(
  managerRow: { subscription_id?: number | null; payment_status?: string | null } | null,
  plans: Array<{ id: number; slug?: string | null }>,
): boolean {
  if (!managerRow || managerRow.payment_status !== "paid") return false;
  const slug = planSlugForSubscription(plans, managerRow.subscription_id ?? null);
  if (!slug) return false;
  return slug !== "basic";
}

/**
 * Whether this owner may create another store (Basic = 1 slot; paid unlimited = no cap).
 */
export async function canOwnerCreateAnotherStore(ownerId: string): Promise<{
  allowed: boolean;
  reason?: "LIMIT_REACHED";
}> {
  const [{ data: plans, error: plansError }, mgrRes, used] = await Promise.all([
    supabase.from("subscriptions").select("id,slug"),
    supabase
      .from("manager_subscriptions")
      .select("subscription_id,payment_status")
      .eq("owner_id", ownerId)
      .maybeSingle(),
    countOwnerStoreSlotsUsed(ownerId),
  ]);

  if (plansError) throw new Error(plansError.message);
  if (mgrRes.error) throw new Error(mgrRes.error.message);

  const planList = (plans ?? []) as Array<{ id: number; slug?: string | null }>;
  const row = mgrRes.data;

  if (isPaidUnlimitedPlan(row, planList)) {
    return { allowed: true };
  }

  if (used >= 1) {
    return { allowed: false, reason: "LIMIT_REACHED" };
  }

  return { allowed: true };
}
