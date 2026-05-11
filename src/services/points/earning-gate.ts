import { supabase } from "@/supabase/supabase";
import { getStoreOwnerId, ownerCanManagePremiumCampaigns } from "@/services/store-manager/premium-campaign-gate";

export async function canUserEarnPurchasePoints(params: {
  userId: string;
  storeId: number | string;
}): Promise<boolean> {
  try {
    const storeId = Number(params.storeId);
    if (!Number.isFinite(storeId)) return true;

    const ownerId = await getStoreOwnerId(storeId);
    const isPremium = await ownerCanManagePremiumCampaigns(ownerId);
    if (isPremium) return true;

    const [{ data: activeStamp }, { data: activeStreak }] = await Promise.all([
      supabase
        .from("store_stamps")
        .select("id")
        .eq("store_id", storeId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("store_streaks")
        .select("id")
        .eq("store_id", storeId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (!activeStamp?.id && !activeStreak?.id) return false;

    if (activeStamp?.id) {
      const { count } = await supabase
        .from("stamp_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", params.userId)
        .eq("stamp_program_id", activeStamp.id);
      if ((count ?? 0) > 0) return true;
    }

    if (activeStreak?.id) {
      const { count } = await supabase
        .from("user_streaks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", params.userId)
        .eq("store_streak_id", activeStreak.id);
      if ((count ?? 0) > 0) return true;
    }

    return false;
  } catch (error) {
    throw new Error("Unable to determine if user can earn purchase points at this time. Please try again later.");
  }
}
