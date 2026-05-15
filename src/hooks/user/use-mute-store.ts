import { useStoreStore } from "@/store/user/store-store";
import { muteStore, unmuteStore, getMutedStores } from "@/services/user/mute-service";
import { useEffect, useState } from "react";;

export function useMuteStore(storeId?: number) {
    const { mutedStoreIds, setMutedStoreIds } = useStoreStore();
    const [isLoading, setIsLoading] = useState(false);

    const isMuted = storeId ? mutedStoreIds.includes(storeId) : false;



    const toggleMute = async () => {
        if (!storeId || isLoading) return;

        setIsLoading(true);
        // Optimistic update
        const currentlyMuted = isMuted;
        if (currentlyMuted) {
            setMutedStoreIds(prev => prev.filter(id => id !== storeId));
        } else {
            setMutedStoreIds(prev => [...prev, storeId]);
        }

        try {
            if (currentlyMuted) {
                await unmuteStore(storeId);
            } else {
                await muteStore(storeId);
            }
        } catch (error) {
            console.error("Failed to toggle mute state:", error);
            // Revert optimistic update on error
            if (currentlyMuted) {
                setMutedStoreIds(prev => [...prev, storeId]);
            } else {
                setMutedStoreIds(prev => prev.filter(id => id !== storeId));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { isMuted, toggleMute, isLoading };
};