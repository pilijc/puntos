import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { AdminStoreRow } from "@/services/store-service";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import { getEffectiveStatus } from "@/type/super-admin/user";
import { supabase } from "@/supabase/supabase";

export const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
export type Filter = (typeof FILTERS)[number];

export function useSuperAdminStores() {
  const { t: translate } = useTranslation();
  const storeState = useSuperAdminStoresStore();
  const { stores, fetchStores, approveStore, rejectStore } = storeState;
  const FILTER_LABELS: Record<Filter, string> = useMemo(
    () => ({
      All: translate("superAdmin.stores.filter.all"),
      pending_review: translate("superAdmin.stores.filter.pending"),
      active: translate("superAdmin.stores.filter.active"),
      inactive: translate("superAdmin.stores.filter.inactive"),
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

  const fetchSubscriptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("manager_subscriptions")
      .select("*");
    if (error) {
      setSubscriptions([]);
      return;
    }
    setSubscriptions(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStores({ forceRefresh: true });
      void fetchSubscriptions();
    }, [fetchStores, fetchSubscriptions]),
  );

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
    setConfirmModal({
      title: translate("superAdmin.stores.modal.approveTitle"),
      message: translate("superAdmin.stores.modal.approveMessage", { name: store.name }),
      label: translate("superAdmin.stores.modal.approveAction"),
      variant: "primary",
      onConfirm: async () => {
        setConfirmModal(null);

        const success = await approveStore(store);
        if (success) {
          setPreviewStore(null);
          setSelectedStore(null);
          useSuperAdminStoresStore.setState({
            errorModal: {
              title: translate("superAdmin.stores.modal.successTitle"),
              message: translate("superAdmin.stores.modal.successMessage", { name: store.name }),
              type: "success",
            },
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
              type: "error",
            },
          });
        }
      },
    });
  };

  const filtered = useMemo(() => {
    const base =
      activeFilter === "All"
        ? stores
        : stores.filter((s) => getEffectiveStatus(s) === activeFilter);

    return base
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeFilter, stores]);

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
