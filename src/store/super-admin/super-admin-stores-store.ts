import { create } from "zustand";
import { AdminStoreRow } from "@/services/store-service";
import { getAllStoresForAdmin, updateAdminStoreStatus } from "@/services/super-admin/store-admin-service";
import { useSubscriptionConfigStore } from "@/store/super-admin/subscription-config";

type AlertModal = { title: string; message: string; type?: "success" | "error" } | null;

interface SuperAdminStoresState {
    stores: AdminStoreRow[];
    loading: boolean;
    error: string | null;
    errorModal: AlertModal;
    hasFetchedOnce: boolean;
    isFetching: boolean;
    page: number;
    pageSize: number;
    hasMore: boolean;

    fetchStores: (options?: { forceRefresh?: boolean; loadMore?: boolean }) => Promise<void>;
    approveStore: (store: AdminStoreRow, forceBypass?: boolean) => Promise<boolean>;
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
    page: 1,
    pageSize: 50,
    hasMore: true,

    fetchStores: async (options = {}) => {
        const { forceRefresh = false, loadMore = false } = options;
        const state = get();

        // Skip if we already fetched and aren't forcing a refresh or loading more
        if (!forceRefresh && !loadMore && state.hasFetchedOnce) return;

        // Prevent parallel fetches
        if (state.isFetching) return;

        // Reset if refreshing or initial fetch
        const nextPage = loadMore ? state.page + 1 : 1;
        const currentStores = loadMore ? state.stores : [];

        // Show loading spinner only if we've never fetched before
        set({ 
            isFetching: true, 
            loading: !state.hasFetchedOnce && !loadMore, 
            error: null,
            page: nextPage
        });

        try {
            const data = await getAllStoresForAdmin(nextPage, state.pageSize);
            
            set({ 
                stores: [...currentStores, ...data], 
                hasFetchedOnce: true,
                hasMore: data.length === state.pageSize
            });
        } catch (e: any) {
            set({ error: e?.message ?? "Failed to load stores" });
        } finally {
            set({ loading: false, isFetching: false });
        }
    },

    approveStore: async (store: AdminStoreRow, forceBypass = false) => {
        try {
            const state = get();
            
            // Note: Since the admin clicked "Agree" on the modal acknowledging the payment,
            // we proceed to activate it. The billing occurs asynchronously via our systems.
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
