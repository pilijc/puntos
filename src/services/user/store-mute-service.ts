import { supabase } from "@/supabase/supabase";

export async function isStoreMutedService(
    userId: string,
    storeId: number
): Promise<boolean> {
    const { data, error } = await supabase
        .from("user_muted_stores")
        .select("user_id")
        .eq("user_id", userId)
        .eq("store_id", storeId)
        .maybeSingle();

    if(error) {
        console.error("isStoreMuted error:", error);
        return false;
    }

    return data !== null;
}

export async function muteStoreService(
    userId: string,
    storeId: number
): Promise<void> {
    const { error } = await supabase
        .from("user_muted_stores")
        .insert({ user_id: userId, store_id: storeId});
    
    if (error && error.code !== "23505") {
        throw error;
    }
}

export async function unmuteStoreService(
    userId: string,
    storeId: number
): Promise<void> {
    const { error } = await supabase
        .from("user_muted_stores")
        .delete()
        .eq("user_id", userId)
        .eq("store_id", storeId)
    
    if (error) throw error;    
}

export async function getMutedStoreIdsService(
    userId: string
): Promise<number[]> {
    const { data, error } = await supabase
        .from("user_muted_stores")
        .select("store_id")
        .eq("user_id", userId);
    
    if(error) {
        console.error("getMutedStoreIds error:", error);
        return [];
    }

    return (data ?? []).map((row) => row.store_id);
}

// will use incase creating mute list
export async function getMutedStoresListService(
    userId: string
) {
    const { data, error } = await supabase
        .from('user_muted_stores')
        .select(`
            created_at,
            store_id,
            stores!inner (
                id,
                name,
                logo,
                address
            )    
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => row.stores)
}