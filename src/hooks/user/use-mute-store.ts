import { useStoreStore } from "@/store/user/store-store";
import { useProfile } from "@/hooks/user/use-profile";
import { useMutedStoresQuery, useToggleMuteStoreMutation } from "@/hooks/user/rq";
import { useEffect } from "react";

export function useMuteStore(storeId?: number) {
    const { mutedStoreIds, setMutedStoreIds } = useStoreStore();
    const { user } = useProfile();
    const mutedStoresQuery = useMutedStoresQuery(user?.id);
    const toggleMuteMutation = useToggleMuteStoreMutation(user?.id);

    useEffect(() => {
        if (mutedStoresQuery.data) {
            setMutedStoreIds(mutedStoresQuery.data);
        }
    }, [mutedStoresQuery.data, setMutedStoreIds]);

    const queryMutedStoreIds = mutedStoresQuery.data ?? mutedStoreIds;
    const isMuted = storeId ? queryMutedStoreIds.includes(storeId) : false;



    const toggleMute = async () => {
        if (!storeId || !user?.id || toggleMuteMutation.isPending) return;

        try {
            await toggleMuteMutation.mutateAsync({ storeId, currentlyMuted: isMuted });
        } catch (error) {
            console.error("Failed to toggle mute state:", error);
        }
    };

    return { isMuted, toggleMute, isLoading: toggleMuteMutation.isPending };
};
