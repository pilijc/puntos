import { useCallback } from "react";
import {
    useCurrentUserProfileQuery,
    useSaveUserProfileMutation,
    useUpdateUserPreferencesMutation,
    useUpdateUserProfileMutation,
} from "@/hooks/user/rq";
import { UserPreferences, UserProfile } from "@/type/settings";
import { logger } from "@/utils/logger";

export const useProfile = () => {
    const profileQuery = useCurrentUserProfileQuery();
    const updateProfileMutation = useUpdateUserProfileMutation();
    const updatePreferencesMutation = useUpdateUserPreferencesMutation();
    const saveProfileMutation = useSaveUserProfileMutation();

    const user = profileQuery.data?.user ?? null;
    const profile = profileQuery.data?.profile ?? null;
    const preferences = profileQuery.data?.preferences ?? {
        near_store_notifications: false,
        location_enabled: false,
        promo_emails: false,
    };

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!user?.id) return { success: false };
        try {
            await updateProfileMutation.mutateAsync({ userId: user.id, updates });
            return { success: true };
        } catch (err) {
            logger.error("Profile update error:", err);
            return { success: false };
        }
    }, [updateProfileMutation, user?.id]);

    const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
        if (!user?.id) return;
        try {
            await updatePreferencesMutation.mutateAsync({ userId: user.id, updates });
        } catch (err) {
            logger.error("Store failed to save preference", err);
        }
    }, [updatePreferencesMutation, user?.id]);

    const saveProfile = useCallback(async (params: {
        username: string;
        avatarUri: string | null;
        initialAvatar: string | null;
    }) => {
        if (!user?.id) return { success: false, error: "No user found" };
        try {
            await saveProfileMutation.mutateAsync({ userId: user.id, ...params });
            return { success: true };
        } catch (error) {
            logger.error("Save profile error:", error);
            return { success: false, error };
        }
    }, [saveProfileMutation, user?.id]);

    const refreshProfile = useCallback(() => profileQuery.refetch(), [profileQuery.refetch]);

    return{
        user,
        profile,
        loading: profileQuery.isPending,
        isSaving: saveProfileMutation.isPending,
        isUploading: saveProfileMutation.isPending,
        preferences,
        updateProfile,
        updatePreferences,
        saveProfile,
        refreshProfile
    };
}
