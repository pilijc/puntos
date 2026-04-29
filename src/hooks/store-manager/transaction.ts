import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { getTransactionsPageForStore } from "@/services/store-manager/transactions-service";
import { useTransactionStore } from "@/store/store-manager/transaction";
import { TypeFilter, ListItem } from "@/type/store-manager/transaction";
import { buildListData } from "@/utils/store_manager/transaction";

export function useTransactions() {
  const { stores, isFetching: storesLoading } = useManagerStoresStore();
  const { storeId: storeIdParam } = useLocalSearchParams<{ storeId?: string }>();
  const didInitSelectedStore = useRef(false);
  const lastStoreIdParam = useRef<string | undefined>(undefined);

  const {
    selectedStoreId,
    typeFilter,
    items,
    page,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    setSelectedStoreId,
    setTypeFilter,
    replaceItems,
    appendItems,
    setLoading,
    setLoadingMore,
    setRefreshing,
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

  const fetchPage = useCallback(
    async (storeId: number, filter: TypeFilter, pageNum: number, isRefresh = false) => {
      if (pageNum === 1 || isRefresh) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await getTransactionsPageForStore(storeId, filter, pageNum);

        if (pageNum === 1) {
          replaceItems(result.items, result.hasMore, pageNum);
        } else {
          appendItems(result.items, result.hasMore, pageNum);
        }
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [appendItems, replaceItems, setLoading, setLoadingMore, setRefreshing]
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedStoreId !== null) {
        fetchPage(selectedStoreId, typeFilter, 1);
      }
    }, [selectedStoreId, typeFilter, fetchPage])
  );

  const selectStore = useCallback(
    (id: number) => {
      if (id === selectedStoreId) return;
      setSelectedStoreId(id);
    },
    [selectedStoreId, setSelectedStoreId]
  );

  const changeFilter = useCallback(
    (filter: TypeFilter) => {
      if (filter === typeFilter) return;
      setTypeFilter(filter);
    },
    [typeFilter, setTypeFilter]
  );

  const loadMore = useCallback(() => {
    if (selectedStoreId === null) return;
    if (!hasMore) return;
    if (loadingMore || loading) return;
    fetchPage(selectedStoreId, typeFilter, page + 1);
  }, [selectedStoreId, hasMore, loadingMore, loading, typeFilter, page, fetchPage]);

  const handleRefresh = useCallback(() => {
    if (selectedStoreId === null) return;
    fetchPage(selectedStoreId, typeFilter, 1, true);
  }, [selectedStoreId, typeFilter, fetchPage]);

  const listItems = useMemo<ListItem[]>(() => buildListData(items), [items]);

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
