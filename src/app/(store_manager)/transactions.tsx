import React, { useCallback, useState } from "react";
import {
  FlatList,
  ScrollView,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
  TouchableOpacity,
  View as NativeView,
} from "react-native";
import { TransactionSkeleton } from "@/components/skeleton/store_manager/transaction-skeleton";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrCode, Stamp, Flame, ReceiptText } from "lucide-react-native";
import { Image } from "expo-image";
import { useTransactions } from "@/hooks/store-manager/transaction";
import { TxType, ListItem } from "@/type/store-manager/transaction";
import { formatTxTime } from "@/utils/store_manager/transaction";

const TYPE_CONFIG: Record<
  TxType,
  { label: string; color: string; bgLight: string; bgDark: string; icon: (c: string) => React.ReactNode }
> = {
  qr:     { label: "QR Purchase", color: "#FF6600", bgLight: "#FFF3E0", bgDark: "#431407", icon: (c) => <QrCode size={11} color={c} /> },
  stamp:  { label: "Stamp",       color: "#3B82F6", bgLight: "#EFF6FF", bgDark: "#1E3A5F", icon: (c) => <Stamp  size={11} color={c} /> },
  streak: { label: "Streak",      color: "#8B5CF6", bgLight: "#F5F3FF", bgDark: "#2D1B69", icon: (c) => <Flame  size={11} color={c} /> },
};


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

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-y-3">
      {icon}
      <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary">{title}</Text>
      <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center px-10">{subtitle}</Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const {
    stores,
    storesLoading,
    selectedStoreId,
    selectStore,
    loading,
    refreshing,
    listItems,
    totalCount,
    handleRefresh,
  } = useTransactions();

  const renderItem = useCallback (
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === "header") {
        return (
          <View className="px-6 pt-3 pb-2">
            <Text className="text-xs font-poppins-semibold text-textMuted dark:text-darkTextMuted">
              {item.label}
            </Text>
          </View>
        );
      }

      const { tx } = item;
      const cfg     = TYPE_CONFIG[tx.type];
      const isFirst = listItems[index - 1]?.kind === "header";
      const isLast  = index === listItems.length - 1 || listItems[index + 1]?.kind === "header";
      const borderColor = isDark ? "#262626" : "#F1F5F9";

      return (
        <View
          className={[
            "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground mx-4 border-l border-r border-b",
            isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
            isLast && "rounded-bl-[12px] rounded-br-[12px]",
          ].filter(Boolean).join(" ")}
          style={{
            borderColor,
          }}
        >
          <NativeView style={{ position: "relative", marginRight: 12 }}>
            {tx.userAvatar ? (
              <Image source={{ uri: tx.userAvatar }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
            ) : (
              <AvatarInitials name={tx.userName} size={40} />
            )}
            <NativeView
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: isDark ? cfg.bgDark : cfg.bgLight,
                alignItems: "center", justifyContent: "center",
                borderWidth: 1.5, borderColor: isDark ? "#171717" : "#FFFFFF",
              }}
            >
              {cfg.icon(cfg.color)}
            </NativeView>
          </NativeView>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted">
                {formatTxTime(tx.date)}
              </Text>
              <Text
                style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, color: cfg.color }}
                numberOfLines={1}
              >
                {tx.detail}
              </Text>
            </View>

            <View className="flex-row items-center justify-between -mt-1">
              <Text
                className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary flex-1 mr-2"
                numberOfLines={1}
              >
                {tx.userName}
              </Text>
              <View>
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                  {cfg.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [isDark, listItems]
  );

  if (storesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground items-center justify-center">
        <ActivityIndicator color="#FF6600" />
      </SafeAreaView>
    );
  }

  const emptyIcon = <ReceiptText size={40} color={isDark ? "#404040" : "#E2E8F0"} strokeWidth={1.5} />;

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
      <View className="bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 py-1">
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">Transactions</Text>
        </View>
      </View>

      {stores.length > 1 && (
        <View className="bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          >
            {stores.map((store) => {
              const active = store.id === selectedStoreId;
              return (
                <TouchableOpacity
                  key={store.id}
                  onPress={() => selectStore(store.id)}
                  activeOpacity={0.75}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 99,
                    backgroundColor: active
                      ? "#FF6600"
                      : isDark ? "#262626" : "#F1F5F9",
                  }}
                >
                  <Text className={`text-xs font-poppins-semibold ${active ? "text-white" : "text-textMuted dark:text-darkTextMuted"}`}
                    numberOfLines={1}
                  >
                    {store.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <TransactionSkeleton />
      ) : stores.length === 0 ? (
        <EmptyState icon={emptyIcon} title="No stores found" subtitle="Create a store to start tracking transactions." />
      ) : listItems.length === 0 ? (
        <EmptyState icon={emptyIcon} title="No transactions yet" subtitle="Transactions will appear here once customers start earning points." />
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FF6600"]} tintColor="#FF6600" />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
