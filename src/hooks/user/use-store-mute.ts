import { useState, useEffect, useCallback } from 'react';
import { useProfileStore } from "@/store/profile-store";
import { isStoreMutedService, muteStoreService, unmuteStoreService } from "@/services/user/store-mute-service";

export function useStoreMute(storeId: number) {
    const user = useProfileStore((state) => state.user);

    const [isMuted, setIsMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const checkMuteStatus = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const muted = await isStoreMutedService(user.id, storeId);
            setIsMuted(muted);
        } catch (e) {
            console.error("failed to check mute status:", e);
        } finally {
            setLoading(false);
        }
    }, [user?.id, storeId]);

    useEffect(() => {
        checkMuteStatus();    
    }, [checkMuteStatus]);

    const toggleMute = async () => {
        if (!user?.id || toggling) return;

        const previousValue = isMuted;
        const newValue = !isMuted;

        // updates the UI immediately(so it can feel instant to user). if it fails then reverts back
        setIsMuted(newValue);
        setToggling(true);

        try{
            if (newValue) {
                await muteStoreService(user.id, storeId);
            } else {
                await unmuteStoreService(user.id, storeId);
            }
        } catch (e) {
            console.error("Failed to toggle mute:", e);
            setIsMuted(previousValue);
        } finally {
            setToggling(false);
        }
    };

    return {
        isMuted,
        loading, //true while initial check is running
        toggling, //true only while toggle action is saving
        toggleMute,
    };
}