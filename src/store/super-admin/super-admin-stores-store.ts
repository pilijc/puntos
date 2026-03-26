import { create } from "zustand";
import { AdminStoreRow, getAllStores, updateStoreStatus } from "@/services/store-service";

interface SuperAdminStoresState {
    stores: AdminStoreRow[];
    loading: boolean;
    error: string | null;
    hasFetchedOnce: boolean;
    isFetching: boolean;

    fetchStores: (forceRefresh?: boolean) => Promise<void>;
    approveStore: (store: AdminStoreRow) => Promise<void>;
    rejectStore: (store: AdminStoreRow) => Promise<void>;
}

export const useSuperAdminStoresStore = create<SuperAdminStoresState>((set, get) => ({
    stores: [],
    loading: false,
    error: null,
    hasFetchedOnce: false,
    isFetching: false,

    fetchStores: async (forceRefresh = false) => {
        const state = get();

        // Skip if we already fetched and aren't forcing a refresh
        if (!forceRefresh && state.hasFetchedOnce) return;

        // Prevent parallel fetches
        if (state.isFetching) return;

        // Show loading spinner only if we've never fetched before
        set({ isFetching: true, loading: !state.hasFetchedOnce, error: null });

        try {
            const data = await getAllStores();
            set({ stores: data, hasFetchedOnce: true });
        } catch (e: any) {
            set({ error: e?.message ?? "Failed to load stores" });
        } finally {
            set({ loading: false, isFetching: false });
        }
    },

    approveStore: async (store: AdminStoreRow) => {
        try {
            await updateStoreStatus(store.id, "active", true);
            
            // Optimistic update
            set((state) => ({
                stores: state.stores.map((s) => 
                    s.id === store.id 
                        ? { ...s, status: "active", is_active: true } 
                        : s
                )
            }));
        } catch (e: any) {
            throw new Error(e?.message ?? "Failed to approve store");
        }
    },

    rejectStore: async (store: AdminStoreRow) => {
        try {
            await updateStoreStatus(store.id, "inactive", false);
            
            // Optimistic update
            set((state) => ({
                stores: state.stores.map((s) => 
                    s.id === store.id 
                        ? { ...s, status: "inactive", is_active: false } 
                        : s
                )
            }));
        } catch (e: any) {
             throw new Error(e?.message ?? "Failed to reject store");
        }
    }
}));
