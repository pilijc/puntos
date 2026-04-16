import { supabase } from "@/supabase/supabase";
import type {
  ManagerSubscriptionRow,
  ManagerSubscriptionPaymentRow,
  PublicUserRow,
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

export async function getManagerSubscriptionPaymentsByOwner(ownerId: string) {
  try {
    console.log("OWNER ID", ownerId);

    const { data, error } = await supabase
      .from("manager_subscription_payments")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

      console.log("DATA", data);

    if (error) {
      console.error("PAYMENTS ERROR", error);
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