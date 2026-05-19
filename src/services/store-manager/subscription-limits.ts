import { supabase } from "@/supabase/supabase";

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

export function isPaidUnlimitedPlan(
  managerRow: { subscription_id?: number | null; payment_status?: string | null } | null,
  plans: Array<{ id: number; slug?: string | null }>,
): boolean {
  if (!managerRow || managerRow.payment_status !== "paid") return false;
  const slug = planSlugForSubscription(plans, managerRow.subscription_id ?? null);
  if (!slug) return false;
  return slug !== "basic";
}

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

export async function checkStoreCreationLimit(): Promise<{
  allowed: boolean;
  reason?: "LIMIT_REACHED" | "NO_USER";
  ownerId?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { allowed: false, reason: "NO_USER" };
  }

  const guard = await canOwnerCreateAnotherStore(user.id);
  return {
    ...guard,
    ownerId: user.id,
  };
}

