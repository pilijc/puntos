import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { Alert } from "react-native";
import {
    getUserProfileService,
    getUserSettingsService,
    updateUserProfileService,
    updateUserSettingsService
} from "@/services/settings-service";
import { UserPreferences } from "@/type/settings";

/**
 * Hook to manage user profile, preferences, and authentication state.
 * Centralizes profile-related logic for use across different settings screens.
 */
export const useProfile = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [preferences, setPreferences] = useState({
        near_store_notifications: false,
        location_enabled: false,
        promo_emails: false,
    });

    /**
     * Loads the current user's profile and settings from Supabase.
     */
    const loadUserProfile = async () => {
        setLoading(true);
        try {
            // Get current authenticated user
            const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
            if (userErr || !currentUser) throw userErr || new Error("No User Found");

            setUser(currentUser);

            // Fetch Profile and Settings in parallel using services
            const [profileData, settingsData] = await Promise.all([
                getUserProfileService(currentUser.id),
                getUserSettingsService(currentUser.id)
            ]);

            if (profileData) setProfile(profileData);

            if (settingsData) {
                setPreferences({
                    near_store_notifications: settingsData.near_store_notifications ?? false,
                    location_enabled: settingsData.location_enabled ?? false,
                    promo_emails: false, // Default currently set as false as the database of it doesn't exist
                });
            }
        } catch (error) {
            console.error("Profile Load Error: ", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates the user's display name.
     * @param newName The new name to set.
     */
    const updateProfile = async (newName: string) => {
        if (!user?.id) return { success: false };
        try {
            await updateUserProfileService(user.id, { name: newName });
            setProfile((prev: any) => ({ ...prev, name: newName }));
            return { success: true };
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to update profile");
            return { success: false };
        }
    };

    /**
     * Updates user preferences in the database and local state.
     * @param updates Partial object containing the preference changes.
     */
    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        if (!user?.id) return;

        // Optimistically update local state
        setPreferences(prev => ({ ...prev, ...updates }));

        try {
            await updateUserSettingsService(user.id, updates);
        } catch (error) {
            console.error("Failed to save preference", error);
            // Rollback state if update fails
            await loadUserProfile();
            Alert.alert("Error", "Failed to save settings. Please try again.");
        }
    };

    // Initial load on mount
    useEffect(() => {
        loadUserProfile();
    }, []);

    return {
        user,
        profile,
        loading,
        preferences,
        setPreferences, // Keep for legacy if needed, but prefer updatePreferences
        updatePreferences,
        updateProfile,
        refreshProfile: loadUserProfile
    };
};
