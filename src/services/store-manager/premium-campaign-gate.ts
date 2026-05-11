import { supabase } from "@/supabase/supabase";
import { getManagerSubscription, getSubscriptionPlans } from "@/services/store-manager/subscription-service";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";

export const PREMIUM_CAMPAIGN_LOCKED_MESSAGE = "Upgrade your plan to create or edit stamp, streak, and reward campaigns.";

const DEFAULT_DOWNGRADE_GRACE_DAYS = 7;

export async function ownerCanManagePremiumCampaigns(ownerId: string | null | undefined): Promise<boolean> {
  if (!ownerId) return false;
  try {
    const [{ data: plans, error: plansError }, mgr] = await Promise.all([
      supabase.from("subscriptions").select("id,slug"),
      getManagerSubscription(ownerId),
    ]);
    if (plansError || !plans?.length) return false;
    const planList = (plans ?? []) as Array<{ id: number; slug?: string | null }>;
    return isPaidUnlimitedPlan(mgr, planList);
  } catch (error) {
    return false;
  }
}

export async function getOwnerPremiumCampaignExpiryDateIso(
  ownerId: string | null | undefined,
  graceDays = DEFAULT_DOWNGRADE_GRACE_DAYS,
): Promise<string | null> {
  if (!ownerId) return null;
  try {
    const mgr = await getManagerSubscription(ownerId).catch(() => null);
    if (!mgr) return null;

    const entitled = await ownerCanManagePremiumCampaigns(ownerId);
    if (entitled) return null;

    const anchor = mgr.current_period_end ?? null;
    if (!anchor) return null;

    const anchorDate = new Date(anchor);
    if (Number.isNaN(anchorDate.getTime())) return null;

    const expires = new Date(anchorDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
    return expires.toISOString();
  } catch (error) {
    throw new Error("Could not determine premium campaign expiry date due to an unexpected error.");
  }
}

export async function getStoreOwnerId(storeId: number | string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("stores").select("owner_id").eq("id", storeId).maybeSingle();
    if (error) return null;
    const owner = data?.owner_id;
    return owner != null ? String(owner) : null;
  } catch (error) {
    throw new Error(`Failed to get store owner id: ${(error as Error)?.message ?? error}`);
  }
}

export async function assertStoreOwnerCanManagePremiumCampaigns(storeId: number | string): Promise<void> {
  try {
    const ownerId = await getStoreOwnerId(storeId);
    const allowed = await ownerCanManagePremiumCampaigns(ownerId);
    if (!allowed) throw new Error(PREMIUM_CAMPAIGN_LOCKED_MESSAGE);
  } catch (error) {
    throw new Error(`Failed to check permission for premium campaign management: ${(error as Error).message ?? error}`);
  }
}
