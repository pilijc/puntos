import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { AdminStoreRow } from "@/services/store-service";
import { fetchAllSubscriptions } from "@/services/super-admin/store-admin-service";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import { useSubscriptionConfigStore } from "@/store/super-admin/subscription-config";
import { getEffectiveStatus } from "@/type/super-admin/user";

export const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
export type Filter = (typeof FILTERS)[number];

export function useSuperAdminStores() {
  const { t: translate } = useTranslation();
  const storeState = useSuperAdminStoresStore();
  const { stores, fetchStores, approveStore, rejectStore } = storeState;

  const FILTER_LABELS: Record<Filter, string> = useMemo(
    () => ({
      All: translate("label.all"),
      pending_review: translate("label.pending"),
      active: translate("label.active"),
      inactive: translate("label.inactive"),
    }),
    [translate],
  );

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
    hideCancel?: boolean;
  } | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { 
    fetchStores({ forceRefresh: true }); 
    fetchSubscriptions();
  }, []));

  const fetchSubscriptions = async () => {
    try {
      const data = await fetchAllSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.warn("[useSuperAdminStores] Failed to fetch subscriptions:", err);
    }
  };

  const onRefresh = async () => { 
    setRefreshing(true); 
    await fetchStores({ forceRefresh: true }); 
    await fetchSubscriptions();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (storeState.isFetching || !storeState.hasMore) return;
    await fetchStores({ loadMore: true });
  };

  const handleApprove = (store: AdminStoreRow) => {
    const ownerActiveStores = stores.filter(
      (s) =>
        s.owner_id === store.owner_id &&
        s.id !== store.id &&
        (s.status === "active" || s.is_active),
    ).length;

    const config = useSubscriptionConfigStore.getState();
    const paidUnlimited = hasPaidUnlimitedOwner(store.owner_id);

    const exceedsLimit =
      config.ENFORCE_SUBSCRIPTION &&
      ownerActiveStores >= config.FREE_STORES_LIMIT &&
      !paidUnlimited;

    if (exceedsLimit) {
      setConfirmModal({
        title: "Limit reached",
        message: config.LIMIT_MESSAGE,
        label: translate("label.ok"),
        variant: "primary",
        hideCancel: true,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    setConfirmModal({
      title: translate("super_admin.stores.modal.approveTitle"),
      message: translate("super_admin.stores.modal.approveMessage", { name: store.name }),
      label: translate("super_admin.stores.modal.approveAction"),
      variant: "primary",
      onConfirm: async () => {
        setConfirmModal(null);

        const success = await approveStore(store);
        if (success) {
          setPreviewStore(null);
          setSelectedStore(null);
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: translate("super_admin.stores.modal.successTitle"),
              message: translate("super_admin.stores.modal.successMessage", { name: store.name }),
              type: "success",
            },
          });
        }
      },
    });
  };

  const handleReject = (store: AdminStoreRow) => {
    setConfirmModal({
      title: translate("super_admin.stores.modal.rejectTitle"),
      message: translate("super_admin.stores.modal.rejectMessage", { name: store.name }),
      label: translate("super_admin.stores.modal.rejectAction"),
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setPreviewStore(null);
        const success = await rejectStore(store);
        if (success) {
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: translate("super_admin.stores.modal.errorTitle"),
              message: translate("super_admin.stores.modal.errorMessage", { name: store.name }),
              type: "error",
            },
          });
        }
      },
    });
  };



  const filtered = useMemo(() =>
    (activeFilter === "All"
      ? stores
      : stores.filter((s) => getEffectiveStatus(s) === activeFilter))
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [stores, activeFilter]
  );

  const pendingCount = useMemo(() =>
    stores.filter((s) => s.status === "pending_review").length,
    [stores]
  );

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
    loadMore,
    handleApprove,
    handleReject,
    getEffectiveStatus,
    filtered,
    pendingCount,
    FILTER_LABELS,
    subscriptions,
  };
}
