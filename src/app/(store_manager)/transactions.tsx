import React, { useCallback, useRef, useState } from "react";
import { FlatList, ScrollView, Modal, Pressable, StyleSheet, useColorScheme, RefreshControl, ActivityIndicator, ListRenderItemInfo, TouchableOpacity, View as NativeView, Dimensions, Platform } from "react-native";
import { TransactionSkeleton, StoresAndFunnelSkeleton } from "@/components/skeleton/store_manager/transaction-skeleton";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrCode, Stamp, Flame, ReceiptText, Funnel, Check } from "lucide-react-native";
import { Image } from "expo-image";
import { useTransactions } from "@/hooks/store-manager/transaction";
import { TxType, TypeFilter, ListItem } from "@/type/store-manager/transaction";
import { formatTxTime } from "@/utils/store_manager/transaction";

const TYPE_CONFIG: Record<
  TxType,
  { label: string; color: string; bgLight: string; bgDark: string; icon: (c: string) => React.ReactNode }
> = {
  qr: { label: "QR Purchase", color: "#FF6600", bgLight: "#FFF3E0", bgDark: "#431407", icon: (c) => <QrCode size={11} color={c} /> },
  stamp: { label: "Stamp", color: "#3B82F6", bgLight: "#EFF6FF", bgDark: "#1E3A5F", icon: (c) => <Stamp size={11} color={c} /> },
  streak: { label: "Streak", color: "#8B5CF6", bgLight: "#F5F3FF", bgDark: "#2D1B69", icon: (c) => <Flame size={11} color={c} /> },
};

const FILTER_OPTIONS: {label: string; value: TypeFilter; icon?: (c: string) => React.ReactNode; color?: string}[] = [
  {label: "All", value: "all"},
  {label: "QR Purchase", value: "qr", icon: TYPE_CONFIG.qr.icon, color: TYPE_CONFIG.qr.color},
  {label: "Stamp", value: "stamp", icon: TYPE_CONFIG.stamp.icon, color: TYPE_CONFIG.stamp.color},
  {label: "Streak", value: "streak", icon: TYPE_CONFIG.streak.icon, color: TYPE_CONFIG.streak.color},
];

function AvatarInitials({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-backgroundMuted dark:bg-darkBackgroundCard items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.34 }} className="font-poppins-bold text-textMuted dark:text-darkTextSecondary">
        {initials}
      </Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";
  const maxWidth = 860;
  const {
    stores, storesLoading,
    selectedStoreId, selectStore,
    typeFilter, setTypeFilter,
    loading, loadingMore, refreshing,
    listItems,
    hasMore, loadMore,
    handleRefresh,
  } = useTransactions();
  const funnelRef = useRef<NativeView>(null);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [funnelAnchor, setFunnelAnchor] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const handleFunnelOpen = useCallback(() => {
    requestAnimationFrame(() => {
      funnelRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setFunnelAnchor({
          top: pageY + height + 6,
          left: pageX + width - 140,
          width,
          height,
        });
        setFunnelOpen(true);
      });
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === "header") {
        return (
          <View className={isWeb ? "px-4 pt-3 pb-2 items-center" : "px-6 pt-3 pb-2"}>
            <View style={isWeb ? { width: "100%", maxWidth } : undefined}>
              <Text className="text-xs font-poppins-semibold text-textMuted dark:text-darkTextMuted">
                {item.label}
              </Text>
            </View>
          </View>
        );
      }

      const { tx } = item;
      const cfg     = TYPE_CONFIG[tx.type];
      const isFirst = listItems[index - 1]?.kind === "header";
      const isLast  = index === listItems.length - 1 || listItems[index + 1]?.kind === "header";
      const borderColor = isDark ? "#262626" : "#F1F5F9";
      
      return (
        <View className={isWeb ? "px-4" : ""}>
          <View style={isWeb ? { width: "100%", maxWidth, alignSelf: "center" } : undefined}>
            <View
              className={[
                "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground border-l border-r border-b",
                !isWeb && "mx-4",
                isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
                isLast && "rounded-bl-[12px] rounded-br-[12px]",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ borderColor }}
            >
              <NativeView style={{ position: "relative", marginRight: 12 }}>
                {tx.userAvatar ? (
                  <Image
                    source={{ uri: tx.userAvatar }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                    contentFit="cover"
                  />
                ) : (
                  <AvatarInitials name={tx.userName} size={40} />
                )}
              </NativeView>

              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <Text
                    className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary"
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {tx.userName}
                  </Text>
                  <Text
                    className="text-sm font-poppins-bold text-primary dark:text-primary"
                    numberOfLines={1}
                  >
                    {tx.detail}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                    {cfg.label}
                  </Text>
                  <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted">
                    {formatTxTime(tx.date)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [isDark, isWeb, listItems]
  );

  const emptyIcon = <ReceiptText size={40} color={isDark ? "#404040" : "#E2E8F0"} strokeWidth={1.5} />;
  const triggerColor = isDark ? "#737373" : "#94A3B8";
  const triggerIcon =
    typeFilter === "qr"
      ? <QrCode size={16} color={triggerColor} />
      : typeFilter === "stamp"
        ? <Stamp size={16} color={triggerColor} />
        : typeFilter === "streak"
          ? <Flame size={16} color={triggerColor} />
          : <Funnel size={16} color={triggerColor} />;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
        <View className="bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">Transactions</Text>
      </View>

      {storesLoading ? (
        <StoresAndFunnelSkeleton />
      ) : stores.length > 1 ? (
        <View className={isWeb ? "bg-backgroundMuted dark:bg-darkBackground px-4 pt-4 pb-3 items-center" : "flex-row items-center bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder pl-5"}>
          
          {isWeb ? (
            <View
              className="w-full bg-white dark:bg-darkBackground border border-neutral-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row items-center"
              style={{ maxWidth }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
              >
                {stores.map((store) => {
                  const storeId = Number(store.id);
                  const active = selectedStoreId !== null && storeId === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => selectStore(storeId)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 99,
                        backgroundColor: active ? "#FF6600" : isDark ? "#262626" : "#F1F5F9",
                      }}
                    >
                      <Text
                        className={`text-xs font-poppins-semibold ${active ? "text-white" : "text-textMuted dark:text-darkTextMuted"}`}
                        numberOfLines={1}
                      >
                        {store.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <NativeView ref={funnelRef} collapsable={false}>
                <TouchableOpacity
                  onPress={handleFunnelOpen}
                  activeOpacity={0.7}
                  style={{
                    alignSelf: "stretch",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderLeftWidth: 1,
                    borderLeftColor: isDark ? "#262626" : "#F1F5F9",
                  }}
                >
                  {triggerIcon}
                </TouchableOpacity>
              </NativeView>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8}}
              >
                {stores.map((store) => {
                  const storeId = Number(store.id);
                  const active = selectedStoreId !== null && storeId === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => selectStore(storeId)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 99,
                        backgroundColor: active ? "#FF6600" : isDark ? "#262626" : "#F1F5F9",
                      }}
                    >
                      <Text
                        className={`text-xs font-poppins-semibold ${active ? "text-white" : "text-textMuted dark:text-darkTextMuted"}`}
                        numberOfLines={1}
                      >
                        {store.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <NativeView ref={funnelRef} collapsable={false}>
                <TouchableOpacity
                  onPress={handleFunnelOpen}
                  activeOpacity={0.7}
                  style={{
                    alignSelf: "stretch",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderLeftWidth: 1,
                    borderLeftColor: isDark ? "#262626" : "#F1F5F9",
                  }}
                >
                  {triggerIcon}
                </TouchableOpacity>
              </NativeView>
            </>
          )}
        </View>
      ) : null}

      {loading || storesLoading ? (
        <TransactionSkeleton />
      ) : stores.length === 0 ? (
        <View className={isWeb ? "px-4 pb-4 items-center" : "px-4 pb-4"}>
          <View
            className={`w-full bg-white dark:bg-darkBackground rounded-xl overflow-hidden justify-start ${isWeb ? "p-4" : "p-3"}`}
            style={isWeb ? { maxWidth } : undefined}
          >
            <View className="items-center justify-center gap-y-3">
              {emptyIcon}
              <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary">No Stores Found</Text>
              <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center px-10">
                Create a store to start tracking transactions.
              </Text>
            </View>
          </View>
        </View>
      ) : listItems.length === 0 ? (
        <View className={isWeb ? "px-4 pb-4 items-center" : "px-4 pb-4 mt-4"}>
          <View
            className={`w-full bg-white dark:bg-darkBackground rounded-xl overflow-hidden justify-start ${isWeb ? "p-6 py-10" : "p-3"}`}
            style={isWeb ? { maxWidth } : undefined}
          >
            <View className="items-center justify-center gap-y-4">
              {emptyIcon}
              <View className="items-center justify-center">
                <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary">No Transactions Found</Text>
                <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center px-10">
                  Transactions will appear here once customers start earning points.
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#FF6600" />
              </View>
            ) : !hasMore && listItems.length > 0 ? (
              <View className="items-center py-2">
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted py-3">
                  You’ve reached the end
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#FF6600"]}
              tintColor="#FF6600"
            />
          }
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={funnelOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setFunnelOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFunnelOpen(false)} />

        <NativeView
          style={{
            position: "absolute",
            top: funnelAnchor.top,
            left: Math.min(
              funnelAnchor.left,
              Dimensions.get("window").width - 140 - 10
            ),
            width: 140,
            backgroundColor: isDark ? "#1c1c1c" : "#FFFFFF",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? "#2a2a2a" : "#E2E8F0",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.07,
          }}
        >
          {FILTER_OPTIONS.map((opt, idx) => {
            const isActive = opt.value === typeFilter;
            const isLast   = idx === FILTER_OPTIONS.length - 1;

            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setTypeFilter(opt.value);
                  setFunnelOpen(false);
                }}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: isDark ? "bg-darkBackgroundCard" : "#F1F5F9",
                }}
              >
                <Text
                  className={
                    ["text-[10px]", isActive ? "font-poppins-semibold text-primary" : "font-poppins text-neutral-500 dark:text-neutral-400"].join(" ")}
                >
                  {opt.label}
                </Text>

                {isActive && (
                  <Check size={12} color="#FF6600" />
                )}
              </TouchableOpacity>
            );
          })}
        </NativeView>
      </Modal>
    </SafeAreaView>
  );
}
