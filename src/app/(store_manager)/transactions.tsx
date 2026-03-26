import React, { useCallback } from "react";
import {
  FlatList,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
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
  {
    label: string;
    color: string;
    bgLight: string;
    bgDark: string;
    icon: (c: string) => React.ReactNode;
  }
> = {
  qr: {
    label: "QR Purchase",
    color: "#FF6600",
    bgLight: "#FFF3E0",
    bgDark: "#431407",
    icon: (c) => <QrCode size={11} color={c} />,
  },
  stamp: {
    label: "Stamp",
    color: "#3B82F6",
    bgLight: "#EFF6FF",
    bgDark: "#1E3A5F",
    icon: (c) => <Stamp size={11} color={c} />,
  },
  streak: {
    label: "Streak",
    color: "#8B5CF6",
    bgLight: "#F5F3FF",
    bgDark: "#2D1B69",
    icon: (c) => <Flame size={11} color={c} />,
  },
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
  const { stores, storesLoading, loading, refreshing, listItems, totalCount, handleRefresh } = useTransactions();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === "header") {
        return (
          <View className="px-6 pt-5 pb-1.5">
            <Text className="text-xs font-poppins-bold text-textMuted dark:text-darkTextMuted uppercase tracking-widest">
              {item.label}
            </Text>
          </View>
        );
      }

      const { tx } = item;
      const cfg    = TYPE_CONFIG[tx.type];
      const isLast = index === listItems.length - 1 || listItems[index + 1]?.kind === "header";

      return (
        <View
          className="flex-row items-center px-6 py-3 bg-background dark:bg-darkBackground"
          style={!isLast ? { borderBottomWidth: 1, borderBottomColor: isDark ? "#262626" : "#F1F5F9" } : undefined}
        >
          <NativeView className="relative mr-3">
            {tx.userAvatar ? (
              <Image source={{ uri: tx.userAvatar }} style={{ width: 38, height: 38, borderRadius: 19 }} contentFit="cover" />
            ) : (
              <AvatarInitials name={tx.userName} size={38} />
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
            <Text className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
              {tx.userName}
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted" numberOfLines={1}>
              {cfg.label} · {tx.detail}
            </Text>
          </View>

          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted ml-2">
            {formatTxTime(tx.date)}
          </Text>
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
        {totalCount > 0 && !loading && (
          <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted">{totalCount}</Text>
        )}
      </View>

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
