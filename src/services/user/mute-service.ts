import { supabase } from "@/supabase/supabase";

export async function getMutedStores(): Promise<number[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return[];

    const { data, error } = await supabase
        .from("user_muted_stores")
        .select("store_id")
        .eq("user_id", auth.user.id);
    
    if (error) throw error;
    return data.map((row: any) => Number(row.store_id));
}

export async function muteStore(storeId: number): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from("user_muted_stores")
        .upsert({
            user_id: auth.user.id,
            store_id: storeId,
        });
    
    if (error) throw error;
}

export async function unmuteStore(storeId: number): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from("user_muted_stores")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("store_id", storeId);
    
    if (error) throw error;
}