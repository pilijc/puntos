import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, RefreshControl, StatusBar, FlatList } from "react-native";
import { SafeAreaView, View, Text } from "@/tw";
import { useUserStore, type UserRoleTab } from "@/store/user-store";
import { BlockUserModal } from "@/components/users/BlockUserModal";
import { FilterBottomSheet } from "@/components/users/FilterBottomSheet";
import { UsersSearchHeader } from "@/components/users/UsersSearchHeader";
import { UserListItem } from "@/components/users/UserListItem";
import { TYPO, COLORS } from "@/components/users/constants";

export default function UsersScreen() {
  const {
    users,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    updatingUserId,
    fetchUsers,
    fetchMoreUsers,
    setRefreshing,
    activeTab,
    statusFilter,
    search,
    showFilterModal,
    setActiveTab,
    setStatusFilter,
    setSearch,
    setShowFilterModal,
    selectedUser,
    showBlockModal,
    openBlockModal,
    closeBlockModal,
    confirmToggleBlock,
    tabCounts,
    flatListData,
    stickyHeaderIndices,
  } = useUserStore();

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

  const counts = useMemo(
    () => tabCounts(),
    [tabCounts, users, activeTab, statusFilter, search]
  );
  const listData = useMemo(
    () => flatListData(),
    [flatListData, users, activeTab, statusFilter, search]
  );
  const stickyHeaders = useMemo(
    () => stickyHeaderIndices(),
    [stickyHeaderIndices, users, activeTab, statusFilter, search]
  );

  const willBlock = selectedUser?.status !== "Blocked";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
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
          keyExtractor={(item, index) =>
            item.isHeader ? `header-${item.title}` : `user-${item.id}-${index}`
          }
          stickyHeaderIndices={stickyHeaders}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
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
    </SafeAreaView>
  );
}
