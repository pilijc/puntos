import { supabase } from "@/supabase/supabase";
import { markIntentionalSignOut } from "@/lib/intentional-signout";
import { UserProfile, UserPreferences } from "@/type/settings";

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

export async function uploadUserAvatarService(userId: string, uri: string): Promise<string | null> {
    if (uri.startsWith('http')) return uri;

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;
    const fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: fileType } as any);

    const { error: uploadError } = await supabase.storage
        .from('puntos-public')
        .upload(filePath, formData, { contentType: fileType, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('puntos-public').getPublicUrl(filePath);
    return data.publicUrl;
}

export async function saveUserProfileService(params: {
    userId: string;
    username: string;
    avatarUri: string | null;
    initialAvatar: string | null;
}): Promise<Partial<UserProfile>> {
    const { userId, username, avatarUri, initialAvatar } = params;
    let finalAvatarUrl = initialAvatar;

    if (avatarUri && avatarUri !== initialAvatar) {
        finalAvatarUrl = await uploadUserAvatarService(userId, avatarUri);
        if (initialAvatar) await deleteOldAvatar(initialAvatar);
    }

    const profileUpdates = { name: username, avatar_url: finalAvatarUrl };
    await updateUserProfileService(userId, profileUpdates);
    return profileUpdates;
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

export async function deleteUserAccountService(): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Could not identify the current user.");
    }

    await softDeleteUserAccountService(user.id);

    markIntentionalSignOut();
    await supabase.auth.signOut();
}

export async function changePasswordService(params: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> {
    const { currentPassword, newPassword } = params;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) throw new Error("Could not find authenticated user");

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });
    if (signInError) throw new Error("INCORRECT_CURRENT_PASSWORD");

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
}

export async function getUsersNearStoreService(
    storeId: number
): Promise<number> {
    const { data, error } = await supabase.rpc('get_users_near_store', {
        store_id_input: storeId,
    });

    if (error) {
        console.error("get_users_near_store error:", error)
        return 0;
    }
    
    return (data ?? []).length;
}
