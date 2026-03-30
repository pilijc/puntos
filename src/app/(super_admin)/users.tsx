import React, { useCallback } from "react";
import { ActivityIndicator, RefreshControl, StatusBar, FlatList } from "react-native";
import { View, Text } from "@/tw";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Modal } from "@/components/modal";
import { BlockUserModal } from "@/components/users/BlockUserModal";
import { FilterBottomSheet } from "@/components/users/FilterBottomSheet";
import { UsersSearchHeader } from "@/components/users/UsersSearchHeader";
import { UserListItem } from "@/components/users/UserListItem";
import { TYPO, COLORS } from "@/type/super-admin/user";
import { useSuperAdminUsers } from "@/hooks/super-admin/use-super-admin-users";

export default function UsersScreen() {
  const {
    loading,
    refreshing,
    loadingMore,
    updatingUserId,
    activeTab,
    statusFilter,
    search,
    showFilterModal,
    selectedUser,
    showBlockModal,
    errorModal,
    setActiveTab,
    setStatusFilter,
    setSearch,
    setShowFilterModal,
    openBlockModal,
    closeBlockModal,
    confirmToggleBlock,
    dismissErrorModal,
    onRefresh,
    onEndReached,
    listData,
    stickyHeaders,
    willBlock,
    getItemLayout,
  } = useSuperAdminUsers();

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <UserListItem item={item} onPress={openBlockModal} />
    ),
    [openBlockModal]
  );

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
        onClose={() => {
          if (errorModal) dismissErrorModal();
          closeBlockModal();
        }}
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
        title={errorModal?.title ?? (errorModal?.type === "success" ? "Success" : "Error")}
        message={errorModal?.message ?? ""}
        buttons={[
          {
            label: "OK",
            onPress: dismissErrorModal,
            variant: errorModal?.type === "success" ? "success" : "primary",
          },
        ]}
        showCloseButton={false}
        dismissOnBackdrop
      />
    </ScreenWrapper>
  );
}