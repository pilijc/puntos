import { useEffect, useCallback, useMemo, useRef } from "react";
import { useUserStore } from "@/store/super-admin/user-store";

const ITEM_HEIGHT = 88;
const HEADER_HEIGHT = 44;

export function useSuperAdminUsers() {
  const store = useUserStore();
  const {
    users, loading, refreshing, loadingMore, hasMore,
    activeTab, statusFilter, search, selectedUser,
    fetchUsers, fetchMoreUsers, setRefreshing, flatListData
  } = store;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers({ reset: true });
  }, [setRefreshing, fetchUsers]);

  const onEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) fetchMoreUsers();
  }, [hasMore, loadingMore, loading, fetchMoreUsers]);

  useEffect(() => {
    fetchUsers({ reset: true });
  }, [fetchUsers]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchUsers({ reset: true });
  }, [activeTab, statusFilter, fetchUsers]);

  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current === search) return;
    prevSearch.current = search;
    const t = setTimeout(() => fetchUsers({ reset: true }), 350);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  const listData = useMemo(() => flatListData(), [flatListData, users, activeTab, statusFilter, search]);
  
  const stickyHeaders = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < listData.length; i++) {
      if (listData[i].isHeader) indices.push(i);
    }
    return indices;
  }, [listData]);

  const willBlock = selectedUser?.status !== "Blocked";

  const getItemLayout = useCallback((_data: any, index: number) => {
    let offset = 0;
    const data = listData;
    for (let i = 0; i < index; i++) {
      offset += data[i]?.isHeader ? HEADER_HEIGHT : ITEM_HEIGHT;
    }
    const length = data[index]?.isHeader ? HEADER_HEIGHT : ITEM_HEIGHT;
    return { length, offset, index };
  }, [listData]);

  return {
    ...store,
    onRefresh,
    onEndReached,
    listData,
    stickyHeaders,
    willBlock,
    getItemLayout,
  };
}
