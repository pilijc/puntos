import { create } from "zustand";
import { supabase } from "@/supabase/supabase";
import { getMyStores, StoreRow } from "@/services/store-service";

interface ManagerStoresState {
    stores: StoreRow[];
    loading: boolean;
    error: string | null;
    hasFetchedOnce: boolean;

    fetchStores: (forceRefresh?: boolean) => Promise<void>;
    addStoreOptimistically: (store: StoreRow) => void;
    updateStoreOptimistically: (updatedStore: StoreRow) => void;
}

export const useManagerStoresStore = create<ManagerStoresState>((set, get) => ({
    stores: [],
    loading: false,
    error: null,
    hasFetchedOnce: false,

    fetchStores: async (forceRefresh = false) => {
        const state = get();
        // If we already have the data in memory and don't need a hard refresh, skip reloading
        if (!forceRefresh && state.hasFetchedOnce) return;

        set({ loading: !state.hasFetchedOnce, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ loading: false });
                return;
            }

            const data = await getMyStores(user.id);
            set({ stores: data, hasFetchedOnce: true });
        } catch (e: any) {
            set({ error: e?.message ?? "Failed to load stores" });
        } finally {
            set({ loading: false });
        }
    },

    addStoreOptimistically: (store) => {
        set((state) => ({
            stores: [store, ...state.stores] // Insert at the top of the list
        }));
    },

    updateStoreOptimistically: (updatedStore) => {
        set((state) => ({
            stores: state.stores.map((s) => (s.id === updatedStore.id ? updatedStore : s))
        }));
    }
}));
