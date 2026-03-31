import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { AdminStoreRow } from "@/services/store-service";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";

export const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
export type Filter = typeof FILTERS[number];

export const FILTER_LABELS: Record<Filter, string> = {
	All: "All",
	pending_review: "Pending",
	active: "Active",
	inactive: "Inactive",
};

export function useSuperAdminStores() {
  const storeState = useSuperAdminStoresStore();
  const { stores, fetchStores, approveStore, rejectStore } = storeState;
  
  const [activeFilter, setActiveFilter] = useState<Filter>("pending_review");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<AdminStoreRow | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "primary" | "danger";
    label: string;
  } | null>(null);

  useFocusEffect(useCallback(() => { fetchStores(); }, []));

  const onRefresh = async () => { 
    setRefreshing(true); 
    await fetchStores(true); 
    setRefreshing(false);
  };

  const handleApprove = (store: AdminStoreRow) => {
    setConfirmModal({
      title: "Approve Store",
      message: `Approve "${store.name}"? It will go live immediately.`,
      label: "Approve",
      variant: "primary",
      onConfirm: async () => {
        setConfirmModal(null);
        const success = await approveStore(store);
        if (success) {
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: "Store Approved",
              message: `"${store.name}" is now active and can begin operations.`,
              type: "success"
            }
          });
        }
      }
    });
  };

  const handleReject = (store: AdminStoreRow) => {
    setConfirmModal({
      title: "Reject Store",
      message: `Reject "${store.name}"? The store-manager will need to resubmit.`,
      label: "Reject",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        const success = await rejectStore(store);
        if (success) {
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: "Application Rejected",
              message: `The application for "${store.name}" has been rejected.`,
              type: "error"
            }
          });
        }
      }
    });
  };

  const getEffectiveStatus = (s: AdminStoreRow) => {
    if (s.status === "pending_review" || !s.status) return "pending_review";
    if (s.status === "inactive") return "inactive";
    return s.is_active ? "active" : "inactive";
  };

  const filtered = (activeFilter === "All"
    ? stores
    : stores.filter((s) => getEffectiveStatus(s) === activeFilter))
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pendingCount = stores.filter((s) => s.status === "pending_review").length;

  return {
    ...storeState,
    activeFilter,
    setActiveFilter,
    refreshing,
    selectedStore,
    setSelectedStore,
    confirmModal,
    setConfirmModal,
    onRefresh,
    handleApprove,
    handleReject,
    getEffectiveStatus,
    filtered,
    pendingCount,
  };
}
