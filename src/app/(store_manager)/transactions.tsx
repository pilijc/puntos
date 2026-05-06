import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, useColorScheme, RefreshControl, ActivityIndicator, ListRenderItemInfo, Dimensions, Platform, View as RNView } from "react-native";
import { TransactionSkeleton, StoresAndFunnelSkeleton } from "@/components/skeleton/store_manager/transaction-skeleton";
import { QrCode, Stamp, Flame, ReceiptText, Funnel, Check } from "lucide-react-native";
import { useTransactions } from "@/hooks/store-manager/transaction";
import { TxType, ListItem } from "@/type/store-manager/transaction";
import { formatTxTime } from "@/utils/store_manager/transaction";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
} from "@/tw";

const TYPE_META: Record<
  TxType,
  { color: string; bgLight: string; bgDark: string; icon: (c: string) => React.ReactNode }
> = {
  qr: { color: "#FF6600", bgLight: "#FFF3E0", bgDark: "#431407", icon: (c) => <QrCode size={11} color={c} /> },
  stamp: { color: "#3B82F6", bgLight: "#EFF6FF", bgDark: "#1E3A5F", icon: (c) => <Stamp size={11} color={c} /> },
  streak: { color: "#8B5CF6", bgLight: "#F5F3FF", bgDark: "#2D1B69", icon: (c) => <Flame size={11} color={c} /> },
};

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <View className="size-10 rounded-full bg-primary/5 items-center justify-center">
      <Text className="text-[13px] font-poppins-bold text-primary dark:text-darkTextMuted">
        {initials}
      </Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const { t: translate } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";
  const {
    stores, storesLoading,
    selectedStoreId, selectStore,
    typeFilter, setTypeFilter,
    loading, loadingMore, refreshing,
    listItems,
    hasMore, loadMore,
    handleRefresh,
  } = useTransactions();
  const funnelRef = useRef<RNView>(null);
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

  const filterOptions = useMemo(
    () =>
      [
        { label: translate("label.all"), value: "all" as const },
        {
          label: translate("label.qrPurchase"),
          value: "qr" as const,
          icon: TYPE_META.qr.icon,
          color: TYPE_META.qr.color,
        },
        {
          label: translate("label.stamp"),
          value: "stamp" as const,
          icon: TYPE_META.stamp.icon,
          color: TYPE_META.stamp.color,
        },
        {
          label: translate("label.streak"),
          value: "streak" as const,
          icon: TYPE_META.streak.icon,
          color: TYPE_META.streak.color,
        },
      ] as const,
    [translate],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === "header") {
        return (
          <View className={isWeb ? "pt-3 pb-2 w-full" : "px-6 pt-3 pb-2"}>
            <View className={isWeb ? "w-full max-w-4xl self-center" : ""}>
              <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
                {item.label}
              </Text>
            </View>
          </View>
        );
      }

      const { tx } = item;
      const isFirst = listItems[index - 1]?.kind === "header";
      const isLast  = index === listItems.length - 1 || listItems[index + 1]?.kind === "header";

      return (
        <View className={isWeb ? "w-full max-w-4xl self-center" : ""}>
            <View
              className={[
                "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground border-l border-r border-b border-slate-100 dark:border-[#262626]",
                !isWeb && "mx-4",
                isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
                isLast && "rounded-bl-[12px] rounded-br-[12px]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <View className="relative mr-3">
                {tx.userAvatar ? (
                  <Image
                    source={{ uri: tx.userAvatar }}
                    className="size-10 rounded-full"
                    contentFit="cover"
                  />
                ) : (
                  <AvatarInitials name={tx.userName} />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <Text
                    className="flex-1 text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary"
                    numberOfLines={1}
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
                  <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                    {translate(`storeManager.transactions.types.${tx.type}`)}
                  </Text>
                  <Text className="text-[10px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                    {formatTxTime(tx.date)}
                  </Text>
                </View>
              </View>
            </View>
        </View>
      );
    },
    [isDark, isWeb, listItems, translate]
  );

  const emptyIllustration = (
    <View className="bg-white dark:bg-darkBackground rounded-xl ">
      <Image
        source={require("@/assets/images/found.png")}
        style={{
          width: Platform.OS === "web" ? 160 : 120,
          height: Platform.OS === "web" ? 160 : 120,
        }}
        resizeMode="contain"
      />

    </View>
  );
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
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          {translate("label.transactions")}
        </Text>
      </View>

      {storesLoading ? (
        <StoresAndFunnelSkeleton />
      ) : stores.length >= 1 ? (
        <View className={isWeb ? "bg-backgroundMuted dark:bg-darkBackground px-4 pt-4 pb-3 items-center" : "flex-row items-center bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder pl-5 mb-4"}>
          
          {isWeb ? (
            <View className="w-full max-w-4xl bg-white dark:bg-darkBackground border border-neutral-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row items-center">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 py-2.5 gap-x-2"
              >
                {stores.map((store) => {
                  const storeId = Number(store.id);
                  const active = selectedStoreId !== null && storeId === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => selectStore(storeId)}
                      activeOpacity={0.75}
                      disabled={stores.length === 1}
                      className={`rounded-full px-2.5 py-1 ${active ? "bg-primary" : "bg-slate-100 dark:bg-neutral-800"}`}
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

              <RNView ref={funnelRef} collapsable={false} className="self-stretch">
                <TouchableOpacity
                  onPress={handleFunnelOpen}
                  activeOpacity={0.7}
                  className="self-stretch items-center justify-center px-3.5 py-2.5 border-l border-slate-100 dark:border-[#262626]"
                >
                  {triggerIcon}
                </TouchableOpacity>
              </RNView>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 py-2.5 gap-x-2"
              >
                {stores.map((store) => {
                  const storeId = Number(store.id);
                  const active = selectedStoreId !== null && storeId === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => selectStore(storeId)}
                      activeOpacity={0.75}
                      disabled={stores.length === 1}
                      className={`rounded-full px-2.5 py-1 ${active ? "bg-primary" : "bg-slate-100 dark:bg-neutral-800"}`}
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

              <RNView ref={funnelRef} collapsable={false} className="self-stretch">
                <TouchableOpacity
                  onPress={handleFunnelOpen}
                  activeOpacity={0.7}
                  className="self-stretch items-center justify-center px-3.5 py-2.5 border-l border-slate-100 dark:border-[#262626]"
                >
                  {triggerIcon}
                </TouchableOpacity>
              </RNView>
            </>
          )}
        </View>
      ) : null}

      {loading || storesLoading ? (
        <TransactionSkeleton />
      ) : stores.length === 0 ? (
        <View className={isWeb ? "px-4 pb-4 items-center mt-4" : "px-4 pb-4 mt-4"}>
          <View
            className={`w-full bg-white dark:bg-darkBackground rounded-xl overflow-hidden justify-start ${isWeb ? "max-w-4xl p-6" : "p-5"}`}
          >
            <View className="items-center justify-center gap-y-4">
              {emptyIllustration}
              <View className="items-center justify-center">
                <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
                  {translate("storeManager.transactions.empty.noStoresTitle")}
                </Text>
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary text-center px-8">
                  {translate("storeManager.transactions.empty.noStoresBody")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : listItems.length === 0 ? (
        <View className={isWeb ? "px-4 pb-4 items-center" : "px-4 pb-4 mt-4"}>
          <View
            className={`w-full bg-white dark:bg-darkBackground rounded-xl overflow-hidden justify-start ${isWeb ? "max-w-4xl p-6 py-10" : "p-5 py-8"}`}
          >
            <View className="items-center justify-center gap-y-5">
              {emptyIllustration}
              <View className="items-center justify-center">
                <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
                  {translate("storeManager.transactions.empty.noTransactionsTitle")}
                </Text>
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary text-center px-8">
                  {translate("storeManager.transactions.empty.noTransactionsBody")}
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
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary py-3">
                  {translate("storeManager.transactions.endOfList")}
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
          contentContainerClassName={isWeb ? "px-4 pb-0" : "pb-0"}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={funnelOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setFunnelOpen(false)}>
        <Pressable className="absolute inset-0" onPress={() => setFunnelOpen(false)} />

        <View
          className="absolute z-50 w-[140px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-md shadow-black/10 dark:border-[#2a2a2a] dark:bg-[#1c1c1c] dark:shadow-lg dark:shadow-black/35"
          style={{
            top: funnelAnchor.top,
            left: Math.min(
              funnelAnchor.left,
              Dimensions.get("window").width - 140 - 10
            ),
          }}
        >
          {filterOptions.map((opt, idx) => {
            const isActive = opt.value === typeFilter;
            const isLast   = idx === filterOptions.length - 1;

            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setTypeFilter(opt.value);
                  setFunnelOpen(false);
                }}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between px-3 py-2 ${!isLast ? "border-b border-slate-100 dark:border-neutral-800" : ""}`}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
