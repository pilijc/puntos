import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { AdminStoreRow } from "@/services/store-service";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import { useSubscriptionConfigStore } from "@/store/super-admin/subscription-config";

export const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
export type Filter = typeof FILTERS[number];

export function useSuperAdminStores() {
  const { t: translate } = useTranslation();
  const storeState = useSuperAdminStoresStore();
  const { stores, fetchStores, approveStore, rejectStore } = storeState;

  const FILTER_LABELS: Record<Filter, string> = useMemo(() => ({
    "All": translate("superAdmin.stores.filter.all"),
    "pending_review": translate("superAdmin.stores.filter.pending"),
    "active": translate("superAdmin.stores.filter.active"),
    "inactive": translate("superAdmin.stores.filter.inactive"),
  }), [translate]);
  
  const [activeFilter, setActiveFilter] = useState<Filter>("pending_review");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<AdminStoreRow | null>(null);
  const [previewStore, setPreviewStore] = useState<AdminStoreRow | null>(null);
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
    // Count how many ACTIVE stores this exact owner currently has
    const ownerActiveStores = stores.filter(s => 
      s.owner_id === store.owner_id && 
      s.id !== store.id && 
      (s.status === "active" || s.is_active)
    ).length;

    // Check if they exceed the free limit to update the warning message
    const config = useSubscriptionConfigStore.getState();
    const isEnforced = config.enforced_stores_ids.includes(store.id);
    
    let customMessage = translate("superAdmin.stores.modal.approveMessage", { name: store.name });
    let actionLabel = translate("superAdmin.stores.modal.approveAction");
    
    if (config.ENFORCE_SUBSCRIPTION && isEnforced) {
      customMessage += `\n\n⚠️ ${config.LIMIT_MESSAGE}`;
      actionLabel = "Agree";
    }

    setConfirmModal({
      title: translate("superAdmin.stores.modal.approveTitle"),
      message: customMessage,
      label: actionLabel,
      variant: "primary",
      onConfirm: async () => {
        setConfirmModal(null);
        if (config.ENFORCE_SUBSCRIPTION && isEnforced) {
          // Do not turn as active store, just close the modal.
          return;
        }
        
        const success = await approveStore(store);
        if (success) {
          setPreviewStore(null);
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: translate("superAdmin.stores.modal.successTitle"),
              message: translate("superAdmin.stores.modal.successMessage", { name: store.name }),
              type: "success"
            }
          });
        }
      },
    });
  };

  const handleReject = (store: AdminStoreRow) => {
    setConfirmModal({
      title: translate("superAdmin.stores.modal.rejectTitle"),
      message: translate("superAdmin.stores.modal.rejectMessage", { name: store.name }),
      label: translate("superAdmin.stores.modal.rejectAction"),
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setPreviewStore(null);
        const success = await rejectStore(store);
        if (success) {
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: translate("superAdmin.stores.modal.errorTitle"),
              message: translate("superAdmin.stores.modal.errorMessage", { name: store.name }),
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
    previewStore,
    setPreviewStore,
    confirmModal,
    setConfirmModal,
    onRefresh,
    handleApprove,
    handleReject,
    getEffectiveStatus,
    filtered,
    pendingCount,
    FILTER_LABELS,
  };
}
