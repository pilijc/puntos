import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, RefreshControl, StatusBar, FlatList } from "react-native";
import { View, Text } from "@/tw";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Modal } from "@/components/modal";
import { useUserStore, type UserRoleTab } from "@/store/super-admin/user-store";
import { BlockUserModal } from "@/components/users/BlockUserModal";
import { FilterBottomSheet } from "@/components/users/FilterBottomSheet";
import { UsersSearchHeader } from "@/components/users/UsersSearchHeader";
import { UserListItem } from "@/components/users/UserListItem";
import { TYPO, COLORS } from "@/components/users/constants";

const ITEM_HEIGHT = 88;
const HEADER_HEIGHT = 44;

export default function UsersScreen() {
  const {
    users,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    updatingUserId,
    activeTab,
    statusFilter,
    search,
    showFilterModal,
    selectedUser,
    showBlockModal,
    errorModal,
    fetchUsers,
    fetchMoreUsers,
    setRefreshing,
    setActiveTab,
    setStatusFilter,
    setSearch,
    setShowFilterModal,
    openBlockModal,
    closeBlockModal,
    confirmToggleBlock,
    dismissErrorModal,
    tabCounts,
    flatListData,
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

  const counts = useMemo(() => tabCounts(), [tabCounts, users]);
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
          getItemLayout={getItemLayout}
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
      {/* Error modal — replaces console.error; surfaces store errors to the user */}
      <Modal
        visible={!!errorModal}
        onClose={dismissErrorModal}
        title={errorModal?.title ?? "Error"}
        message={errorModal?.message ?? ""}
        buttons={[{ label: "OK", onPress: dismissErrorModal, variant: "primary" }]}
        showCloseButton={false}
        dismissOnBackdrop
      />
    </ScreenWrapper>
  );
}