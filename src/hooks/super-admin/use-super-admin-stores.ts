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
  const [planSlugs, setPlanSlugs] = useState<Map<number, string>>(new Map());

  const fetchSubscriptions = useCallback(async () => {
    const [{ data: subs }, { data: plans }] = await Promise.all([
      supabase.from("manager_subscriptions").select("*"),
      supabase.from("subscriptions").select("id, slug"),
    ]);
    setSubscriptions(subs ?? []);
    const m = new Map<number, string>();
    (plans ?? []).forEach((p: { id: number; slug: string | null }) =>
      m.set(Number(p.id), String(p.slug ?? "").toLowerCase()),
    );
    setPlanSlugs(m);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStores({ forceRefresh: true });
      void fetchSubscriptions();
    }, [fetchStores, fetchSubscriptions]),
  );

  const hasPaidUnlimitedOwner = useCallback(
    (ownerId: string | null | undefined) => {
      if (!ownerId) return false;
      const sub = subscriptions.find((s) => s.owner_id === ownerId);
      if (!sub || sub.payment_status !== "paid") return false;
      const slug = planSlugs.get(Number(sub.subscription_id));
      return Boolean(slug && slug !== "basic");
    },
    [subscriptions, planSlugs],
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
    const ownerActiveStores = stores.filter(
      (s) =>
        s.owner_id === store.owner_id &&
        s.id !== store.id &&
        (s.status === "active" || s.is_active),
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
      title: translate("superAdmin.stores.modal.approveTitle"),
      message: translate("superAdmin.stores.modal.approveMessage", { name: store.name }),
      label: translate("superAdmin.stores.modal.approveAction"),
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
              type: "error",
            },
          });
        }
      },
      },
    });
  };



  const filtered = (
    activeFilter === "All"
      ? stores
      : stores.filter((s) => getEffectiveStatus(s) === activeFilter)
  )
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
