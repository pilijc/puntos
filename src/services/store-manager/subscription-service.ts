import { supabase } from "@/supabase/supabase";

export type ManagerSubscriptionRow = {
  id?: number;
  owner_id: string;
  subscription_id: number | null;
  is_enforced?: boolean;
  payment_status: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
};

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

/** Current manager billing row (one per owner). */
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
      console.error("Checkout failed:", result);
      return null;
    }
    return result?.checkout_url ?? null;
  } catch (err) {
    console.error("useSubscriptionCheckout error:", err);
    return null;
  }
}

export { normalizeSubscriptionId };
