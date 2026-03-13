import { create } from "zustand";
import { supabase } from "@/supabase/supabase";
import { getMyStores, StoreRow } from "@/services/store-service";

interface ManagerStoresState {
    stores: StoreRow[];
    loading: boolean;
    error: string | null;
    hasFetchedOnce: boolean;
    isFetching: boolean;

    fetchStores: (forceRefresh?: boolean) => Promise<void>;
    addStoreOptimistically: (store: StoreRow) => void;
    updateStoreOptimistically: (updatedStore: StoreRow) => void;
}

export const useManagerStoresStore = create<ManagerStoresState>((set, get) => ({
    stores: [],
    loading: false,
    error: null,
    hasFetchedOnce: false,
    isFetching: false,

    fetchStores: async (forceRefresh = false) => {
        const state = get();

        // Skip if data is fresh and no force refresh requested
        if (!forceRefresh && state.hasFetchedOnce) return;

        // Prevent concurrent in-flight fetches
        if (state.isFetching) return;

        // Only show skeleton on first-ever load; background refreshes are silent
        set({ isFetching: true, loading: !state.hasFetchedOnce, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ loading: false, isFetching: false });
                return;
            }

            const data = await getMyStores(user.id);
            set({ stores: data, hasFetchedOnce: true });
        } catch (e: any) {
            set({ error: e?.message ?? "Failed to load stores" });
        } finally {
            set({ loading: false, isFetching: false });
        }
    },

    addStoreOptimistically: (store) => {
        set((state) => ({
            stores: [store, ...state.stores]
        }));
    },

    updateStoreOptimistically: (updatedStore) => {
        set((state) => ({
            stores: state.stores.map((s) => (s.id === updatedStore.id ? updatedStore : s))
        }));
    }
}));

