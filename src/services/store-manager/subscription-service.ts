import { supabase } from "@/supabase/supabase";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import { logger } from "@/utils/logger";

export type ManagerSubscriptionRow = {
  id?: number;
  owner_id: string;
  subscription_id: number | null;
  is_enforced?: boolean;
  payment_status: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  paymongo_subscription_id?: string | null;
};

export type ManagerSubscriptionPaymentRow = {
  id?: number;
  owner_id: string;
  payment_reference?: string | null;
  amount_paid: string | number | null;
  amount_due?: string | number | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export async function getAuthenticatedUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function getManagerSubscriptionPayments(
  ownerId: string,
): Promise<ManagerSubscriptionPaymentRow[]> {
  const { data, error } = await supabase
    .from("manager_subscription_payments")
    .select(
      "id,owner_id,payment_reference,amount_paid,amount_due,payment_status,paid_at,created_at,billing_period_start,billing_period_end",
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ManagerSubscriptionPaymentRow[];
}

export async function upsertManagerSubscriptionByOwner(
  ownerId: string,
  fields: Record<string, unknown>,
): Promise<{ error: Error | null }> {
  const patch = { ...fields, updated_at: new Date().toISOString() };

  const { data: updatedRows, error: updateError } = await supabase
    .from("manager_subscriptions")
    .update(patch)
    .eq("owner_id", ownerId)
    .select("id");

  if (updateError) {
    return { error: new Error(updateError.message) };
  }
  if (updatedRows?.length) {
    return { error: null };
  }

  const { error: insertError } = await supabase.from("manager_subscriptions").insert({
    owner_id: ownerId,
    ...patch,
  });

  if (
    insertError &&
    (insertError.code === "23505" || insertError.message.includes("duplicate key"))
  ) {
    const { error: retryError } = await supabase
      .from("manager_subscriptions")
      .update(patch)
      .eq("owner_id", ownerId);
    return { error: retryError ? new Error(retryError.message) : null };
  }

  return { error: insertError ? new Error(insertError.message) : null };
}

export async function getSubscriptionPlans() {
  const { data, error } = await supabase.from("subscriptions").select("*");
  if (error) throw error;
  return data ?? [];
}

export function pickBasicAndProPlans(plans: Array<Record<string, unknown>>): {
  basicPlan: Record<string, unknown> | null;
  proPlan: Record<string, unknown> | null;
} {
  const basicPlan =
    plans.find((p) => String(p?.slug ?? "").toLowerCase() === "basic") ?? plans[0] ?? null;
  const proPlan = plans.find((p) => String(p?.slug ?? "").toLowerCase() === "pro") ?? null;
  return { basicPlan, proPlan };
}

export async function getManagerSubscription(
  ownerId: string,
): Promise<ManagerSubscriptionRow | null> {
  const { data, error } = await supabase
    .from("manager_subscriptions")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getSubscriptionPaymentStatus(ownerId: string): Promise<string | null> {
  const row = await getManagerSubscription(ownerId);
  return row?.payment_status ?? null;
}

function normalizeSubscriptionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export type CancelManagerSubscriptionResult =
  | { ok: true; current_period_end?: string | null; already_scheduled?: boolean }
  | { ok: false; error: string };

export async function cancelManagerSubscription(): Promise<CancelManagerSubscriptionResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: plans, error: plansError } = await supabase.from("subscriptions").select("id,slug");
  if (plansError || !plans?.length) {
    return { ok: false, error: plansError?.message ?? "Could not load plans" };
  }

  const { data: row, error: rowError } = await supabase
    .from("manager_subscriptions")
    .select("owner_id,payment_status,subscription_id,cancel_at_period_end,current_period_end")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (rowError) {
    return { ok: false, error: rowError.message };
  }
  if (!row) {
    return { ok: false, error: "No subscription record" };
  }

  if (!isPaidUnlimitedPlan(row, plans as Array<{ id: number; slug?: string | null }>)) {
    return { ok: false, error: "Nothing to cancel" };
  }
  if (row.cancel_at_period_end) {
    return {
      ok: true,
      already_scheduled: true,
      current_period_end: row.current_period_end ?? null,
    };
  }

  const { error: upErr } = await supabase
    .from("manager_subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", ownerId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const { data: refreshed } = await supabase
    .from("manager_subscriptions")
    .select("current_period_end,cancel_at_period_end")
    .eq("owner_id", ownerId)
    .maybeSingle();

  return {
    ok: true,
    current_period_end: refreshed?.current_period_end ?? row.current_period_end ?? null,
    already_scheduled: false,
  };
}

export async function useSubscriptionCheckout(
  ownerId: string,
  slug: string,
  amount: number,
  name: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/functions/v1/create_subscription_checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ANON_KEY}`,
        },
        body: JSON.stringify({
          owner_id: ownerId,
          slug,
          data: {
            attributes: {
              line_items: [
                {
                  amount,
                  name,
                  quantity: 1,
                },
              ],
              payment_method_types: ["card", "gcash"],
            },
          },
        }),
      },
    );

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      logger.error("Checkout failed:", result);
      return null;
    }
    return result?.checkout_url ?? null;
  } catch (err) {
    logger.error("useSubscriptionCheckout error:", err);
    return null;
  }
}

export { normalizeSubscriptionId };

export type SubscriptionRealtimeUnsubscribe = () => void;

export function subscribeToManagerSubscriptionRealtime(params: {
  ownerId: string;
  onChange: () => void;
}): SubscriptionRealtimeUnsubscribe {
  const { ownerId, onChange } = params;

  const channel = supabase
    .channel(`manager-subscription-${ownerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "manager_subscriptions",
        filter: `owner_id=eq.${ownerId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "manager_subscription_payments",
        filter: `owner_id=eq.${ownerId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}