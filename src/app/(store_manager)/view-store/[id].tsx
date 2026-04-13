import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, Platform, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView } from "@/tw";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoreById } from "@/services/store-service";
import { getTransactionsPageForStore } from "@/services/store-manager/transactions-service";
import { TransactionItem, type_badge } from "@/type/store-manager/transaction";
import { formatTxTime } from "@/utils/store_manager/transaction";
import { Modal, ModalButton } from "@/components/modal";
import { Building2, Gift, QrCode, UsersRound, Stamp, Flame, ChevronLeft, ChevronRight, Loader2, ReceiptText } from "lucide-react-native";
import { AppHeader } from "@/components/header";

export default function ViewStore() {
  const { id } = useLocalSearchParams();
  const storeId = Number(id);
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const colorScheme = useColorScheme();
  const isDarkHeader = colorScheme === "dark";
  const carouselCardPadding = isWeb ? 8 : 0;
  const carouselMaxWidth = isWeb ? 860 : screenWidth - 32;
  const carouselWidth = Math.max(0, Math.min(screenWidth - 32, carouselMaxWidth) - carouselCardPadding * 2);
  const [store, setStore] = useState<Awaited<ReturnType<typeof getStoreById>> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [recentTxs, setRecentTxs] = useState<TransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);

  const menuItems = useMemo(
    () => [
      { key: "staff",   label: "Staff",       description: "Manage team",        icon: <UsersRound size={18} color="#FF6600" />, route: "/(store_manager)/staff"              as const },
      { key: "streak",  label: "Streak",      description: "Daily rewards",      icon: <Flame      size={18} color="#FF6600" />, route: "/(store_manager)/streak" as const },
      { key: "stamp",   label: "Stamp",       description: "Punch cards",        icon: <Stamp      size={18} color="#FF6600" />, route: "/(store_manager)/stamp/"   as const },
      { key: "qr",      label: "QR Purchase", description: "Scan rewards",       icon: <QrCode     size={18} color="#FF6600" />, route: "/(store_manager)/qr"                 as const },
      { key: "rewards", label: "Rewards",     description: "Redeemable items",   icon: <Gift       size={18} color="#FF6600" />, route: "/(store_manager)/reward"             as const },
      { key: "media",   label: "Details",     description: "Manage Store",       icon: <Building2  size={18} color="#FF6600" />, route: "/(store_manager)/detail"             as const },
    ],
    []
  );

  const carouselImages = useMemo(() => {
    const pictures = (store?.store_pictures ?? []).filter((u): u is string => !!u);
    if (pictures.length > 0) return pictures;
    if (store?.logo) return [store.logo];
    return [require("@/assets/images/puntos-icon.png")];
  }, [store?.store_pictures, store?.logo]);

  const onCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const cardWidth = e.nativeEvent.layoutMeasurement.width;
    if (!cardWidth) return;
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setActiveImageIndex(nextIndex);
  }, []);

  const fetchStore = useCallback(async () => {
    const storeData = await getStoreById(storeId);
    setStore(storeData);
  }, [storeId]);

  const fetchRecentTransactions = useCallback(async () => {
    if (!Number.isFinite(storeId) || storeId <= 0) return;
    setTxLoading(true);
    try {
      const { items } = await getTransactionsPageForStore(storeId, "all", 1, 10);
      setRecentTxs(items);
    } catch {
      setRecentTxs([]);
    } finally {
      setTxLoading(false);
    }
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStore(), fetchRecentTransactions()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStore, fetchRecentTransactions]);

  useEffect(() => {
    setStore(null);
    setActiveImageIndex(0);
    void fetchStore();
    void fetchRecentTransactions();
  }, [fetchStore, fetchRecentTransactions]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
        timer={modal?.timer ? 3000 : undefined}
      />
      <AppHeader
        title={store?.name || "Store Details"}
        description={store?.address || "View & manage store info"}
        onBackPress={() => {
          router.push("/(store_manager)/stores");
        }}
      />
      {/* <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-2 py-2">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full -mt-0.5"
            activeOpacity={0.7}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/(store_manager)/stores");
            }}
          >
            <ChevronLeft size={20} color={isDarkHeader ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
          <View className="min-w-0 flex-1 px-2 py-1">
            <Text className="text-center text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
              {store?.name || "Store Details"}
            </Text>
            <Text
              className="-mt-0.5 text-center text-xs font-poppins text-textMuted dark:text-darkTextMuted"
              numberOfLines={2}
            >
              {store?.address || "View & manage store info"}
            </Text>
          </View>
          <View className="min-w-10" />
        </View>
      </View> */}

      <ScrollView
        className="flex-1 gap-y-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View className="items-center">
          <View className="w-full px-4 items-center">
            <View
              className={isWeb ? "bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl overflow-hidden p-2" : ""}
              style={isWeb ? { width: "100%", maxWidth: 860 } : undefined}
            >
              <View className="w-full h-40 rounded-xl overflow-hidden">
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onCarouselScroll}
                  scrollEventThrottle={16}
                  className="w-full h-40"
                >
                  {carouselImages.map((img, idx) => (
                    <Image
                      key={`${typeof img === "string" ? img : "default"}-${idx}`}
                      source={typeof img === "string" ? { uri: img } : img}
                      style={{ width: carouselWidth, height: 144 }}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
                {carouselImages.length > 1 && (
                  <View
                    className="flex-row items-center justify-center gap-x-1.5 absolute bottom-4 left-0 right-0"
                  >
                    {carouselImages.map((_, i) => (
                      <View
                        key={`dot-${i}`}
                        className={`rounded-full ${activeImageIndex === i ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {Platform.OS === "web" ? (
          <View className="px-4 py-3 items-center">
            <View
              className="w-full bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-3"
              style={{ maxWidth: 860 }}
            >
              <View className="flex-row flex-wrap gap-y-2 justify-between">
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: item.route, params: { storeId } })}
                    style={{ width: "32.5%" }}
                    className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-3"
                  >
                    <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 -ml-1">
                      {item.icon}
                    </View>
                    <Text className="text-[11px] font-poppins-semibold text-slate-800 dark:text-slate-100 leading-4">
                      {item.label}
                    </Text>
                    <Text className="text-[9px] font-poppins text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View className="px-4 py-3">
            <View className="flex-row flex-wrap gap-y-2 justify-between">
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: item.route, params: { storeId } })}
                  style={{ width: "32.5%" }}
                  className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-3"
                >
                  <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 -ml-1">
                    {item.icon}
                  </View>
                  <Text className="text-[11px] font-poppins-semibold text-slate-800 dark:text-slate-100 leading-4">
                    {item.label}
                  </Text>
                  <Text className="text-[9px] font-poppins text-slate-400 dark:text-slate-500 mt-0.5">
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isWeb ? (
          <View className="px-4 items-center">
            <View style={{ width: "100%", maxWidth: 860 }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-poppins-bold text-textSecondary dark:text-textSecondary ml-1">
                  Recent Transactions
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="flex-row items-center gap-x-0.5"
                  onPress={() =>
                    router.push({ pathname: "/(store_manager)/transactions", params: { storeId: String(storeId) } })
                  }
                >
                  <Text className="text-xs font-poppins text-primary">See all</Text>
                  <ChevronRight size={14} color="#FF6600" />
                </TouchableOpacity>
              </View>

              {txLoading ? (
                <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-8 items-center">
                  <Loader2 className="animate-spin" size={28} color="#CBD5E1" />
                </View>
              ) : recentTxs.length === 0 ? (
                <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-10 items-center gap-y-2">
                  <ReceiptText size={32} color="#CBD5E1" />
                  <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                    No transactions yet
                  </Text>
                </View>
              ) : (
                <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  {recentTxs.map((tx, idx) => (
                    <View
                      key={tx.id}
                      className={`flex-row items-center px-4 py-3 gap-x-3 ${
                        idx < recentTxs.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
                      }`}
                    >
                      {tx.userAvatar ? (
                        <Image
                          source={{ uri: tx.userAvatar }}
                          style={{ width: 36, height: 36, borderRadius: 18 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                          <Text className="text-xs font-poppins-bold text-slate-600 dark:text-slate-300">
                            {(tx.userName || "?").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center justify-between gap-x-2">
                          <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
                            {tx.userName}
                          </Text>
                          <Text className="text-xs font-poppins-semibold text-primary shrink-0">{tx.detail}</Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-0.5">
                          <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                            {type_badge[tx.type]}
                          </Text>
                          <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                            {formatTxTime(tx.date)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-poppins-bold text-textSecondary dark:text-textSecondary ml-1">
                Recent Transactions
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center gap-x-0.5"
                onPress={() =>
                  router.push({ pathname: "/(store_manager)/transactions", params: { storeId: String(storeId) } })
                }
              >
                <Text className="text-xs font-poppins text-primary">See all</Text>
                <ChevronRight size={14} color="#FF6600" />
              </TouchableOpacity>
            </View>

            {txLoading ? (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-8 items-center">
                <Loader2 className="animate-spin" size={28} color="#CBD5E1" />
              </View>
            ) : recentTxs.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-10 items-center gap-y-2">
                <ReceiptText size={32} color="#CBD5E1" />
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                  No transactions yet
                </Text>
              </View>
            ) : (
              <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {recentTxs.map((tx, idx) => (
                  <View
                    key={tx.id}
                    className={`flex-row items-center px-4 py-3 gap-x-3 ${
                      idx < recentTxs.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
                    }`}
                  >
                    {tx.userAvatar ? (
                      <Image
                        source={{ uri: tx.userAvatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                        <Text className="text-xs font-poppins-bold text-slate-600 dark:text-slate-300">
                          {(tx.userName || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center justify-between gap-x-2">
                        <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
                          {tx.userName}
                        </Text>
                        <Text className="text-xs font-poppins-semibold text-primary shrink-0">{tx.detail}</Text>
                      </View>
                      <View className="flex-row items-center justify-between mt-0.5">
                        <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                          {type_badge[tx.type]}
                        </Text>
                        <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                          {formatTxTime(tx.date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
