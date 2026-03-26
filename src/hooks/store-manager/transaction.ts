import { useCallback, useEffect, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useStores } from "@/hooks/use-stores";
import { getAllTransactionsForStore } from "@/services/store-manager/transactions-service";
import { useTransactionStore } from "@/store/store-manager/transaction";
import { ListItem } from "@/type/store-manager/transaction";
import { buildListData } from "@/utils/store_manager/transaction";

export function useTransactions() {
  const { stores, loading: storesLoading } = useStores();
  const {
    selectedStoreId,
    qrData, stampData, streakData,
    loading, refreshing,
    setSelectedStoreId, setData, setLoading, setRefreshing,
  } = useTransactionStore();

  useEffect(() => {
    if (stores.length > 0 && selectedStoreId === null) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const fetchData = useCallback(async (storeId: number, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { qr, stamp, streak } = await getAllTransactionsForStore(storeId);
      setData(qr, stamp, streak);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedStoreId !== null) {
        setData([], [], []);
        fetchData(selectedStoreId);
      }
    }, [selectedStoreId, fetchData])
  );

  const handleRefresh = useCallback(() => {
    if (selectedStoreId !== null) {
      setRefreshing(true);
      fetchData(selectedStoreId, true);
    }
  }, [selectedStoreId, fetchData]);

  const listItems = useMemo<ListItem[]>(
    () => buildListData([...qrData, ...stampData, ...streakData]),
    [qrData, stampData, streakData]
  );

  const totalCount = qrData.length + stampData.length + streakData.length;

  return {
    stores,
    storesLoading,
    loading,
    refreshing,
    listItems,
    totalCount,
    handleRefresh,
  };
}
