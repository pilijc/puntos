import { supabase } from "@/supabase/supabase";

export interface StoreFeatureRow {
    id: number;
    store_id: number;
    streak_enabled: boolean;
    stamp_enabled: boolean;
    reward_enabled: boolean;
}

export interface UpdateStoreFeaturesPayload {
    streak_enabled: boolean;
    stamp_enabled: boolean;
    reward_enabled: boolean;
}

export async function getStoreFeaturesById(storeId: string): Promise<StoreFeatureRow | null> {
    const { data, error } = await supabase
        .from("store_feature")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data as StoreFeatureRow | null;
}

export async function updateStoreFeatures(
    storeId: string,
    payload: UpdateStoreFeaturesPayload,
): Promise<void> {
    const { error } = await supabase
        .from("store_feature")
        .update(payload)
        .eq("store_id", storeId);

    if (error) throw new Error(error.message);
}
