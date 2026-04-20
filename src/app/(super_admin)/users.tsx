import React, { useCallback } from "react";
import { ActivityIndicator, RefreshControl, StatusBar, FlatList, Platform } from "react-native";
import { View, Text } from "@/tw";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { UsersModal as Modal } from "@/components/users/UsersModal";
import { BlockUserModal } from "@/components/users/BlockUserModal";
import { FilterBottomSheet } from "@/components/users/FilterBottomSheet";
import { UsersSearchHeader } from "@/components/users/UsersSearchHeader";
import { UserListItem } from "@/components/users/UserListItem";
import { TYPO, COLORS } from "@/type/super-admin/user";
import { useSuperAdminUsers } from "@/hooks/super-admin/use-super-admin-users";
import { useTranslation } from "react-i18next";

const isWeb = Platform.OS === "web";

export default function UsersScreen() {
  const colorScheme = require('react-native').useColorScheme();
  const isDark = colorScheme === 'dark';
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
    tabCounts,
  } = useSuperAdminUsers();
  const { t: translate } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <UserListItem item={item} onPress={openBlockModal} />
    ),
    [openBlockModal]
  );

  return (
    <ScreenWrapper className="flex-1 bg-background dark:bg-darkBackground">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <UsersSearchHeader
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        statusFilter={statusFilter}
        onFilterPress={() => setShowFilterModal(true)}
        counts={tabCounts()}
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
          contentContainerStyle={[
            {
              paddingBottom: 110,
              paddingTop: isWeb ? 8 : 0,
            },
            isWeb && {
              width: "100%",
              maxWidth: 1000,
              alignSelf: "center",
              paddingHorizontal: 16,
            },
          ]}
          style={isWeb ? { backgroundColor: isDark ? "#111827" : "#F8FAFC" } : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          initialNumToRender={15}
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
              <Text className={`${TYPO.subtitle} dark:text-darkTextSecondary`}>
                {translate("superAdmin.users.noUsersFound")}
              </Text>
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
      {/* Error modal */}
      <Modal
        visible={!!errorModal}
        onClose={dismissErrorModal}
        title={errorModal?.title ?? (errorModal?.type === "success" ? translate("label.success") : translate("label.error"))}
        message={errorModal?.message ?? ""}
        buttons={[
          {
            label: translate("label.ok"),
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