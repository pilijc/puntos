import { create } from "zustand";
import { supabase } from "@/supabase/supabase";
import { UserProfile, UserPreferences } from "@/type/settings";
import {
    getUserProfileService,
    getUserSettingsService,
    updateUserProfileService,
    updateUserSettingsService,
    deleteOldAvatar
} from "@/services/user/settings-service";


interface ProfileState {
    user: any | null;
    profile: UserProfile | null;
    preferences: UserPreferences;
    loading: boolean;
    isSaving: boolean,
    isUploading: boolean,

    fetchProfile: () => Promise<void>;
    updateProfile: (updates: { name?: string; avatar_url?: string | null}) => Promise<{ success: boolean }>;
    updatePreferences: (update: Partial<UserPreferences>) => Promise<void>; 
    saveProfile: (params: { username: string; avatarUri: string | null; initialAvatar: string | null; }) => Promise<{ success: boolean }>;
}

const uploadImageAction = async (userId: string, uri: string): Promise<string | null> => {
    if (uri.startsWith('http')) return uri;

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;;
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
};

export const useProfileStore = create<ProfileState>((set, get) => ({
    user: null,
    profile: null,
    loading: false,
    isSaving: false,
    isUploading: false,
    preferences: {
        near_store_notifications: false,
        location_enabled: false,
        promo_emails: false,
    },

    fetchProfile: async () => {
        set({ loading: true });
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error("No User Found");

            const [profileData, settingsData] = await Promise.all([
                getUserProfileService(currentUser.id),
                getUserSettingsService(currentUser.id)
            ])

            set({
                user: currentUser,
                profile: profileData,
                preferences: {
                    near_store_notifications: settingsData?.near_store_notifications ?? false,
                    location_enabled: settingsData?.location_enabled ?? false,
                    promo_emails: false, //placeholder for future feature
                }
            })
        } catch (error) {
            console.error("Profile store load error:", error);
        } finally {
            set({ loading: false })
        }
    },

    updateProfile: async (updates) => {
        const { user, profile } = get();
        if (!user?.id) return { success: false };

        try {
            if (updates.avatar_url && profile?.avatar_url && updates.avatar_url !== profile.avatar_url){
                await deleteOldAvatar(profile.avatar_url);
            }

            await updateUserProfileService(user.id, updates);

            set((state) => ({
                profile: state.profile ? { ...state.profile, ...updates } : null
            }));
            return { success: true };
        } catch (err) {
            console.error("Profile update error:", err);
            return { success: false };
        }
    },

    updatePreferences: async (updates) => {
        const { user } = get();
        if (!user?.id) return;

        const previousPreferences = get().preferences;
        set((state) => ({
            preferences: { ...state.preferences, ...updates }
        }));

        try {
            await updateUserSettingsService(user.id, updates);
        } catch (err) {
            console.error("Store failed to save preference", err);
            set({ preferences: previousPreferences});
        }
    },

    saveProfile: async ({ username, avatarUri, initialAvatar }) => {
        const { user } = get();
        if (!user?.id) return { success: false, error: "No user found" };

        set({ isSaving: true });
        try {
            let finalAvatarUrl = initialAvatar;

            if (avatarUri && avatarUri !== initialAvatar) {
                set({ isUploading: true });
                if (initialAvatar) await deleteOldAvatar(initialAvatar);
                finalAvatarUrl = await uploadImageAction(user.id, avatarUri);
                set({ isUploading: false });
            }

            const profileUpdates = { name: username, avatar_url: finalAvatarUrl };
            await updateUserProfileService(user.id, profileUpdates);

            set((state) => ({
                profile: state.profile ? { ...state.profile, ...profileUpdates } : null
            }));

            return { success: true };
        } catch (error) {
            console.error("Save profile error:", error);
            return { success: false, error };
        } finally {
            set ({ isSaving: false, isUploading: false });
        }
    },
}));

