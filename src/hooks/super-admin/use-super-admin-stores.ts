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

  const ownerActiveStoreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const store of stores) {
      if ((store.status === "active" || store.is_active) && store.owner_id) {
        counts[store.owner_id] = (counts[store.owner_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [stores]);

  const hasProSubscription = useCallback((ownerId: string | null) => {
    if (!ownerId) return false;
    const sub = subscriptions.find((s) => s.owner_id === ownerId);
    // Based on subscription-limits.ts, it must have a subscription and payment_status === "paid"
    return !!sub && !!sub.subscription_id && sub.payment_status === "paid";
  }, [subscriptions]);

  const loadMore = async () => {
    if (storeState.isFetching || !storeState.hasMore) return;
    await fetchStores({ loadMore: true });
  };

  const handleApprove = (store: AdminStoreRow) => {
    const ownerId = store.owner_id;
    const activeCount = ownerId ? (ownerActiveStoreCounts[ownerId] ?? 0) : 0;
    const isPro = hasProSubscription(ownerId);

    // If owner already has 1 or more active stores and is NOT Pro
    if (activeCount >= 1 && !isPro) {
      setConfirmModal({
        title: translate("superAdmin.stores.modal.exceededTitle", { defaultValue: "Store Exceeded Subscriptions" }),
        message: translate("superAdmin.stores.modal.exceededMessage", {
          name: store.owner_name || "The manager",
          storeName: store.name,
          defaultValue: `${store.owner_name || "The manager"} already has an active store. To approve "${store.name}", they must upgrade to a Pro subscription.`
        }),
        label: translate("superAdmin.stores.modal.exceededAction", { defaultValue: "I Understand" }),
        variant: "primary",
        hideCancel: true,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    const executeApprove = async () => {
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
    };

    void executeApprove();
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
    ownerActiveStoreCounts,
    hasProSubscription,
  };
}
