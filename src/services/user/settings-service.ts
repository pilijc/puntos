import { supabase } from "@/supabase/supabase";
import { UserProfile, UserPreferences } from "@/type/user/settings";

export async function getUserProfileService(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function getUserSettingsService(userId: string): Promise<any | null> {
    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function updateUserSettingsService(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    const { data, error: fetchError } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (data?.id) {
        const { error } = await supabase
            .from("user_settings")
            .update(updates)
            .eq("id", data.id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from("user_settings")
            .insert({ user_id: userId, ...updates });
        if (error) throw error;
    }
}

export async function syncLocationService(userId: string, latitude: number, longitude: number): Promise<void> {
    const { error } = await supabase
        .from("user_settings")
        .update({ location: `POINT(${longitude} ${latitude})` })
        .eq("user_id", userId);

    if (error) throw error;
}

export async function clearLocationService(userId: string): Promise<void> {
    const { error } = await supabase
        .from("user_settings")
        .update({ location: null })
        .eq("user_id", userId);
    
    if (error) throw error;
}

export async function updateUserProfileService(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
        .from("users")
        .upsert({ id: userId, ...updates });

    if (error) throw error;
}

export async function deleteOldAvatar(oldUrl: string | null): Promise<void> {
    if (!oldUrl) return;
    try {
        const urlObj = new URL(oldUrl);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf('puntos-public');
        if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            const { error } = await supabase.storage.from('puntos-public').remove([filePath]);
            if (error) console.error("Error deleting old avatar:", error);
        }
    } catch (e) {
        console.error("Failed to parse old avatar URL for deletion:", e);
    }
}

export async function softDeleteUserAccountService(userId: string): Promise<void> {
    const { error } = await supabase
        .from("user_settings")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", userId);

    if (error) throw error;
}

export async function getUsersNearStoreService(
    storeId: number,
    radiusMetres: number = 30
): Promise<number> {
    const { data, error } = await supabase.rpc('get_users_near_store', {
        store_id_input: storeId,
        radius_metres: radiusMetres,
    });

    if (error) {
        console.error("get_users_near_store error:", error)
        return 0;
    }
    
    return (data ?? []).length;
}