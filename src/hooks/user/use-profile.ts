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
        if (!user && !loading) {
            fetchProfile();
        }
    }, [user, loading, fetchProfile]);

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