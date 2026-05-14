import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useTransactionStore } from "@/store/store-manager/transaction";
import { TypeFilter, ListItem, TransactionItem } from "@/type/store-manager/transaction";
import { buildListData } from "@/utils/store_manager/transaction";
import { useStoreTransactionsInfinite } from "@/hooks/store-manager/rq";

export function useTransactions() {
  const { stores, isFetching: storesLoading } = useManagerStoresStore();
  const { storeId: storeIdParam } = useLocalSearchParams<{ storeId?: string }>();
  const didInitSelectedStore = useRef(false);
  const lastStoreIdParam = useRef<string | undefined>(undefined);

  const {
    selectedStoreId,
    typeFilter,
    setSelectedStoreId,
    setTypeFilter,
  } = useTransactionStore();

  useEffect(() => {
    if (stores.length === 0) return;
    const storeIds = new Set(stores.map((s) => Number(s.id)));
    const paramChanged = lastStoreIdParam.current !== storeIdParam;

    if (paramChanged) {
      didInitSelectedStore.current = false;
      lastStoreIdParam.current = storeIdParam;
    }

    if (didInitSelectedStore.current) return;

    let desired: number | null = null;

    if (storeIdParam) {
      const id = Number(storeIdParam);
      if (Number.isFinite(id) && storeIds.has(id)) desired = id;
    }

    if (desired == null && selectedStoreId != null && storeIds.has(Number(selectedStoreId))) {
      desired = Number(selectedStoreId);
    }

    if (desired == null) {
      desired = Number(stores[0].id);
    }

    if (desired != null && desired !== selectedStoreId) {
      setSelectedStoreId(desired);
    }

    didInitSelectedStore.current = true;
  }, [stores, storeIdParam, selectedStoreId, setSelectedStoreId]);

  const txQuery = useStoreTransactionsInfinite(selectedStoreId, typeFilter);

  const items: TransactionItem[] = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [txQuery.data?.pages],
  );

  const listItems = useMemo<ListItem[]>(() => buildListData(items), [items]);

  const selectStore = useCallback(
    (id: number) => {
      if (id === selectedStoreId) return;
      setSelectedStoreId(id);
    },
    [selectedStoreId, setSelectedStoreId],
  );

  const changeFilter = useCallback(
    (filter: TypeFilter) => {
      if (filter === typeFilter) return;
      setTypeFilter(filter);
    },
    [typeFilter, setTypeFilter],
  );

  const loadMore = useCallback(() => {
    if (!txQuery.hasNextPage || txQuery.isFetchingNextPage) return;
    void txQuery.fetchNextPage();
  }, [txQuery]);

  const handleRefresh = useCallback(() => {
    void txQuery.refetch();
  }, [txQuery]);

  const loading = Boolean(selectedStoreId != null && txQuery.isPending && !txQuery.data);
  const loadingMore = txQuery.isFetchingNextPage;
  const refreshing = txQuery.isRefetching && !txQuery.isFetchingNextPage;
  const hasMore = Boolean(txQuery.hasNextPage);

  return {
    stores,
    storesLoading,
    selectedStoreId,
    selectStore,
    typeFilter,
    setTypeFilter: changeFilter,
    loading,
    loadingMore,
    refreshing,
    listItems,
    hasMore,
    loadMore,
    handleRefresh,
  };
}
