import { useEffect } from "react";
import { useProfileStore } from "@/store/profile-store";

export const useProfile = () => {
    const {
        user,
        profile,
        loading,
        preferences,
        fetchProfile,
        updateProfile,
        updatePreferences
    } = useProfileStore();

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return{
        user,
        profile,
        loading,
        preferences,
        updateProfile,
        updatePreferences,
        refreshProfile: fetchProfile
    };
}