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
        try {
            if (isMuted) {
                await unmuteStore(storeId);
                setMutedStoreIds(prev => prev.filter(id => id !== storeId));
            } else {
                await muteStore(storeId);
                setMutedStoreIds(prev => [...prev, storeId]);
            }
        } catch (error) {
            console.error("Failed to toggle mute state:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { isMuted, toggleMute, isLoading };
};