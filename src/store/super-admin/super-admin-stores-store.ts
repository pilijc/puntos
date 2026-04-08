import { create } from "zustand";
import { AdminStoreRow } from "@/services/store-service";
import { getAllStoresForAdmin, updateAdminStoreStatus } from "@/services/super-admin/store-admin-service";

type AlertModal = { title: string; message: string; type?: "success" | "error" } | null;

interface SuperAdminStoresState {
    stores: AdminStoreRow[];
    loading: boolean;
    error: string | null;
    errorModal: AlertModal;
    hasFetchedOnce: boolean;
    isFetching: boolean;

    fetchStores: (forceRefresh?: boolean) => Promise<void>;
    approveStore: (store: AdminStoreRow) => Promise<boolean>;
    rejectStore: (store: AdminStoreRow) => Promise<boolean>;
    dismissErrorModal: () => void;
}

export const useSuperAdminStoresStore = create<SuperAdminStoresState>((set, get) => ({
    stores: [],
    loading: false,
    error: null,
    errorModal: null,
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
            const data = await getAllStoresForAdmin();
            set({ stores: data, hasFetchedOnce: true });
        } catch (e: any) {
            set({ error: e?.message ?? "Failed to load stores" });
        } finally {
            set({ loading: false, isFetching: false });
        }
    },

    approveStore: async (store: AdminStoreRow) => {
        try {
            const updatedStore = await updateAdminStoreStatus(store.id, "active", true);
            
            // Replace the local store with the real updated DB row
            set((state) => ({
                stores: state.stores.map((s) => 
                    s.id === store.id ? updatedStore : s
                )
            }));
            return true;
        } catch (e: any) {
            set({ 
                errorModal: {
                    title: "Approval Failed",
                    message: e?.message ?? "Failed to approve store application.",
                    type: "error"
                }
            });
            return false;
        }
    },

    rejectStore: async (store: AdminStoreRow) => {
        try {
            await updateAdminStoreStatus(store.id, "inactive", false);
            
            // Optimistic update
            set((state) => ({
                stores: state.stores.map((s) => 
                    s.id === store.id 
                        ? { ...s, status: "inactive", is_active: false } 
                        : s
                )
            }));
            return true;
        } catch (e: any) {
            set({ 
                errorModal: {
                    title: "Rejection Failed",
                    message: e?.message ?? "Failed to reject store application.",
                    type: "error"
                }
            });
            return false;
        }
    },

    dismissErrorModal: () => set({ errorModal: null }),
}));
