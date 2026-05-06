import { supabase } from "@/supabase/supabase";
import { StoreFeature } from "@/type/store-manager/features";
import { assertStoreOwnerCanManagePremiumCampaigns } from "@/services/store-manager/premium-campaign-gate";

export async function getStoreFeaturesById(storeId: string): Promise<StoreFeature | null> {
	try {
		const { data, error } = await supabase
			.from("store_feature")
			.select("*")
			.eq("store_id", storeId)
			.maybeSingle();

		if (error) throw new Error(error.message);
		return data as StoreFeature | null;
	} catch (err) {
		console.error("Error in getStoreFeaturesById:", err);
		throw err;
	}
}

export async function updateStoreFeatures(payload: StoreFeature): Promise<void> {
	try {
		const storeId = String(payload.store_id);
		const { data: existing } = await supabase
			.from("store_feature")
			.select("stamp_enabled,streak_enabled,reward_enabled")
			.eq("store_id", storeId)
			.maybeSingle();

		const prev = existing as { stamp_enabled?: boolean; streak_enabled?: boolean; reward_enabled?: boolean } | null;
		const campaignsChanged =
			prev == null ||
			Boolean(prev.stamp_enabled) !== Boolean(payload.stamp_enabled) ||
			Boolean(prev.streak_enabled) !== Boolean(payload.streak_enabled) ||
			Boolean(prev.reward_enabled) !== Boolean(payload.reward_enabled);

		if (campaignsChanged) {
			await assertStoreOwnerCanManagePremiumCampaigns(storeId);
		}

		const { error } = await supabase
			.from("store_feature")
			.upsert({
				store_id: payload.store_id,
				streak_enabled: payload.streak_enabled,
				stamp_enabled: payload.stamp_enabled,
				reward_enabled: payload.reward_enabled,
				qr_enabled: payload.qr_enabled,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "store_id" });

		if (error) throw new Error(error.message);
	} catch (err) {
		console.error("Error in updateStoreFeatures:", err);
		throw err;
	}
}