import { useCallback, useEffect, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useStores } from "@/hooks/store-manager/use-stores";
import { getTransactionsPageForStore } from "@/services/store-manager/transactions-service";
import { useTransactionStore } from "@/store/store-manager/transaction";
import { TypeFilter, ListItem } from "@/type/store-manager/transaction";
import { buildListData } from "@/utils/store_manager/transaction";

export function useTransactions() {
  const { stores, loading: storesLoading } = useStores();

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
    if (stores.length > 0 && selectedStoreId === null) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId, setSelectedStoreId]);

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
