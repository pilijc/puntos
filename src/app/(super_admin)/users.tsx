import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, RefreshControl, StatusBar, FlatList } from "react-native";
import { View, Text } from "@/tw";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { useUserStore, type UserRoleTab } from "@/store/super-admin/user-store";
import { BlockUserModal } from "@/components/users/BlockUserModal";
import { FilterBottomSheet } from "@/components/users/FilterBottomSheet";
import { UsersSearchHeader } from "@/components/users/UsersSearchHeader";
import { UserListItem } from "@/components/users/UserListItem";
import { TYPO, COLORS } from "@/components/users/constants";

export default function UsersScreen() {
  const users = useUserStore((state) => state.users);
  const loading = useUserStore((state) => state.loading);
  const refreshing = useUserStore((state) => state.refreshing);
  const loadingMore = useUserStore((state) => state.loadingMore);
  const hasMore = useUserStore((state) => state.hasMore);
  const updatingUserId = useUserStore((state) => state.updatingUserId);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const fetchMoreUsers = useUserStore((state) => state.fetchMoreUsers);
  const setRefreshing = useUserStore((state) => state.setRefreshing);
  const activeTab = useUserStore((state) => state.activeTab);
  const statusFilter = useUserStore((state) => state.statusFilter);
  const search = useUserStore((state) => state.search);
  const showFilterModal = useUserStore((state) => state.showFilterModal);
  const setActiveTab = useUserStore((state) => state.setActiveTab);
  const setStatusFilter = useUserStore((state) => state.setStatusFilter);
  const setSearch = useUserStore((state) => state.setSearch);
  const setShowFilterModal = useUserStore((state) => state.setShowFilterModal);
  const selectedUser = useUserStore((state) => state.selectedUser);
  const showBlockModal = useUserStore((state) => state.showBlockModal);
  const openBlockModal = useUserStore((state) => state.openBlockModal);
  const closeBlockModal = useUserStore((state) => state.closeBlockModal);
  const confirmToggleBlock = useUserStore((state) => state.confirmToggleBlock);
  const tabCounts = useUserStore((state) => state.tabCounts);
  const flatListData = useUserStore((state) => state.flatListData);
  const stickyHeaderIndices = useUserStore((state) => state.stickyHeaderIndices);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers({ reset: true });
  }, [setRefreshing, fetchUsers]);

  const onEndReached = useCallback(() => {
    if (hasMore && !loadingMore) fetchMoreUsers();
  }, [hasMore, loadingMore, fetchMoreUsers]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <UserListItem item={item} onPress={openBlockModal} />
    ),
    [openBlockModal]
  );

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
  }, [activeTab, statusFilter]);

  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current === search) return;
    prevSearch.current = search;
    const t = setTimeout(() => fetchUsers({ reset: true }), 350);
    return () => clearTimeout(t);
  }, [search]);

  const counts = useMemo(() => tabCounts(), [tabCounts, users]);
  const listData = useMemo(() => flatListData(), [flatListData, users, activeTab, statusFilter, search]);
  const stickyHeaders = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < listData.length; i++) {
      if (listData[i].isHeader) indices.push(i);
    }
    return indices;
  }, [listData]);

  const ITEM_HEIGHT = 88;
  const HEADER_HEIGHT = 44;

  const getItemLayout = useCallback((data: any, index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const item = data[i];
      offset += (item && item.isHeader) ? HEADER_HEIGHT : ITEM_HEIGHT;
    }
    const currentItem = data[index];
    const length = (currentItem && currentItem.isHeader) ? HEADER_HEIGHT : ITEM_HEIGHT;
    return { length, offset, index };
  }, []);

  const willBlock = selectedUser?.status !== "Blocked";

  return (
    <ScreenWrapper className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <UsersSearchHeader
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        statusFilter={statusFilter}
        onFilterPress={() => setShowFilterModal(true)}
        tabCounts={counts}
      />
      {loading && !refreshing && listData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item.isHeader ? `header-${item.title}` : `user-${item.id}`
          }
          getItemLayout={(_data, index) => {
            const item = listData[index];
            if (!item) return { length: 0, offset: 0, index };
            // Header is 44px, User Item is 88px (approximate but fixed is better than none)
            const height = item.isHeader ? 44 : 88;
            let offset = 0;
            for (let i = 0; i < index; i++) {
              offset += listData[i]?.isHeader ? 44 : 88;
            }
            return { length: height, offset, index };
          }}
          stickyHeaderIndices={stickyHeaders}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Text className={TYPO.subtitle}>No users found</Text>
            </View>
          }
        />
      )}
      <BlockUserModal
        visible={showBlockModal}
        selectedUser={selectedUser}
        willBlock={willBlock}
        updatingUserId={updatingUserId}
        onClose={closeBlockModal}
        onConfirm={confirmToggleBlock}
      />
      <FilterBottomSheet
        visible={showFilterModal}
        statusFilter={statusFilter}
        onClose={() => setShowFilterModal(false)}
        onSelectFilter={setStatusFilter}
      />
    </ScreenWrapper>
  );
}
