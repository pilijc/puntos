import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { getMyStores, StoreRow, deleteStore as deleteStoreService } from "@/services/store-service";

export type StoreStatusFilter = "All" | "active" | "inactive" | "pending_review";

export interface UseStoresReturn {
    stores: StoreRow[];
    filteredStores: StoreRow[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    activeFilter: StoreStatusFilter;
    setActiveFilter: (filter: StoreStatusFilter) => void;
    refresh: () => void;
    deleteStore: (storeId: number) => Promise<void>;
    ownerId: string | null;
}

export function useStores(): UseStoresReturn {
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<StoreStatusFilter>("All");
    const [ownerId, setOwnerId] = useState<string | null>(null);

    const fetchStores = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setStores([]);
                return;
            }

            setOwnerId(user.id);
            const data = await getMyStores(user.id);
            setStores(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load stores");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const refresh = useCallback(() => {
        setRefreshing(true);
        fetchStores(true);
    }, [fetchStores]);

    const deleteStore = useCallback(async (storeId: number) => {
        await deleteStoreService(storeId);
        await fetchStores(true);
    }, [fetchStores]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const filteredStores =
        activeFilter === "All"
            ? stores
            : stores.filter((s) => s.status === activeFilter);

    return {
        stores,
        filteredStores,
        loading,
        refreshing,
        error,
        activeFilter,
        setActiveFilter,
        refresh,
        deleteStore,
        ownerId,
    };
}
