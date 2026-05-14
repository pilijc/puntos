import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
  Dimensions,
  Platform,
  View as RNView,
  Keyboard,
} from "react-native";
import { TransactionSkeleton, StoresAndFunnelSkeleton } from "@/components/skeleton/store_manager/transaction-skeleton";
import { QrCode, Stamp, Flame, Funnel, Check, Star } from "lucide-react-native";
import { useTransactions } from "@/hooks/store-manager/transaction";
import { useStarredTxStores } from "@/hooks/store-manager/use-starred-tx-stores";
import { TxType, ListItem } from "@/type/store-manager/transaction";
import type { StoreRow } from "@/services/store-service";
import { formatTxTime } from "@/utils/store_manager/transaction";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ScrollView,
  TextInput,
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
  const { starredIds, toggleStar } = useStarredTxStores();
  const funnelRef = useRef<RNView>(null);
  const selectingStoreFromResultsRef = useRef(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [isStoreSearching, setIsStoreSearching] = useState(false);
  const [showStarredStores, setShowStarredStores] = useState(false);
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

  const showSearchResults =
    stores.length > 1 && isStoreSearching && storeSearchQuery.trim().length > 0;

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

  const selectedStore = useMemo(
    () =>
      stores.find((s) => Number(s.id) === selectedStoreId) ?? stores[0] ?? null,
    [stores, selectedStoreId],
  );

  const storeSearchValue = isStoreSearching
    ? storeSearchQuery
    : (selectedStore?.name ?? "");

  const starredStoresOrdered = useMemo(() => {
    return starredIds
      .map((id) => stores.find((s) => Number(s.id) === id))
      .filter((s): s is StoreRow => s != null);
  }, [starredIds, stores]);

  const hasStarredStores = starredStoresOrdered.length > 0;

  const filteredStoresForPicker = useMemo(() => {
    const q = storeSearchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.id).includes(q),
    );
  }, [stores, storeSearchQuery]);

  const storePickerExtraData = useMemo(
    () => ({ starredIds, selectedStoreId }),
    [starredIds, selectedStoreId],
  );

  const stopSearching = useCallback(() => {
    setIsStoreSearching(false);
    setStoreSearchQuery("");
  }, []);

  const renderStorePickerRow = useCallback(
    ({ item }: ListRenderItemInfo<StoreRow>) => {
      const id = Number(item.id);
      const active = selectedStoreId !== null && id === selectedStoreId;
      const starred = starredIds.includes(id);
      return (
        <View className="flex-row items-center border-b border-slate-100 dark:border-neutral-800">
          <TouchableOpacity
            onPress={() => {
              selectingStoreFromResultsRef.current = true;
              selectStore(id);
              stopSearching();
              Keyboard.dismiss();
              requestAnimationFrame(() => {
                selectingStoreFromResultsRef.current = false;
              });
            }}
            activeOpacity={0.7}
            className="min-w-0 flex-1 flex-row items-center gap-2 py-2.5 pl-3 pr-2"
          >
            <Text
              className={`min-w-0 flex-1 text-sm font-poppins ${active ? "font-poppins-semibold text-primary" : "text-textPrimary dark:text-darkTextPrimary"}`}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [selectStore, selectedStoreId, starredIds, stopSearching, toggleStar, translate],
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
        <View
          className={
            isWeb
              ? "w-full items-center bg-backgroundMuted px-4 pb-3 pt-4 dark:bg-darkBackground"
              : "mb-4 w-full items-center border-b border-neutral-100 bg-background px-4 pb-3 pt-3 dark:border-darkBorder dark:bg-darkBackground"
          }
          style={{ position: "relative", zIndex: 100, elevation: 30 }}
        >
          <View
            className={
              isWeb
                ? "w-full max-w-4xl self-center"
                : "w-full max-w-4xl self-center"
            }
            style={{ zIndex: 100 }}
          >
            <View
              className="w-full flex-row items-stretch gap-x-2"
              style={{ zIndex: 50 }}
            >
              {stores.length > 1 ? (
                <View
                  className="min-w-0 flex-1 basis-0 rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground"
                  style={{ position: "relative", zIndex: 50 }}
                >
                  <RNView
                    collapsable={false}
                    className="w-full"
                  >
                    <TextInput
                      value={storeSearchValue}
                      onChangeText={(text) => {
                        if (!isStoreSearching) setIsStoreSearching(true);
                        setStoreSearchQuery(text);
                      }}
                      onFocus={() => {
                        if (!isStoreSearching) {
                          setIsStoreSearching(true);
                          setStoreSearchQuery(storeSearchValue);
                        }
                      }}
                      onPressIn={() => {
                        if (!isStoreSearching) {
                          setIsStoreSearching(true);
                          setStoreSearchQuery(storeSearchValue);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          if (selectingStoreFromResultsRef.current) return;
                          stopSearching();
                        }, 120);
                      }}
                      selectTextOnFocus={false}
                      placeholder={translate(
                        "storeManager.transactions.storePicker.searchPlaceholder",
                      )}
                      placeholderTextColor={isDark ? "#737373" : "#94A3B8"}
                      autoCorrect={false}
                      autoCapitalize="none"
                      clearButtonMode="while-editing"
                      returnKeyType="search"
                      accessibilityLabel={translate(
                        "storeManager.transactions.storePicker.searchAccessibility",
                      )}
                      style={[
                        isWeb ? ({ outlineStyle: "none" } as any) : null,
                        {
                          height: 42,
                          lineHeight: 20,
                          paddingVertical: 0,
                          textAlignVertical: "center",
                          includeFontPadding: false,
                        },
                      ]}
                      className="px-3 text-sm font-poppins text-slate-900 dark:text-slate-100"
                    />
                  </RNView>

                  {showSearchResults ? (
                    <View
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/15 dark:border-[#2a2a2a] dark:bg-[#1c1c1c] dark:shadow-black/40"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 6,
                        maxHeight: Math.min(
                          320,
                          Dimensions.get("window").height * 0.5,
                        ),
                        zIndex: 100,
                        elevation: 20,
                      }}
                    >
                      <FlatList<StoreRow>
                        data={filteredStoresForPicker}
                        keyExtractor={(s) => String(s.id)}
                        renderItem={renderStorePickerRow}
                        extraData={storePickerExtraData}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="none"
                        nestedScrollEnabled
                        initialNumToRender={16}
                        maxToRenderPerBatch={24}
                        windowSize={8}
                        ListEmptyComponent={
                          <View className="items-center px-4 py-8">
                            <Text className="text-center text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                              {translate(
                                "storeManager.transactions.storePicker.noMatches",
                              )}
                            </Text>
                          </View>
                        }
                      />
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="min-w-0 flex-1 basis-0 justify-center overflow-hidden rounded-xl border border-neutral-100 bg-white px-3 py-2.5 dark:border-darkBorder dark:bg-darkBackground">
                  <Text
                    className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-100"
                    numberOfLines={1}
                  >
                    {selectedStore?.name ?? "—"}
                  </Text>
                </View>
              )}

              <View className="w-11 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground">
                <TouchableOpacity
                  onPress={() => {
                    if (!hasStarredStores) return;
                    setShowStarredStores((v) => !v);
                  }}
                  disabled={!hasStarredStores}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  className="h-full min-h-[42px] w-full items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={translate("storeManager.transactions.storePicker.hint", {
                    count: stores.length,
                  })}
                >
                  <Star
                    size={16}
                    color={hasStarredStores ? "#FF6600" : triggerColor}
                    fill={showStarredStores && hasStarredStores ? "#FF6600" : "transparent"}
                  />
                </TouchableOpacity>
              </View>

              <View className="w-11 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground">
                <RNView ref={funnelRef} collapsable={false} className="w-full h-full">
                  <TouchableOpacity
                    onPress={handleFunnelOpen}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    className="h-full min-h-[42px] w-full items-center justify-center"
                  >
                    {triggerIcon}
                  </TouchableOpacity>
                </RNView>
              </View>
            </View>

            {showStarredStores && starredStoresOrdered.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-2 w-full"
                contentContainerClassName="flex-row gap-x-2 py-0.5"
              >
                {starredStoresOrdered.map((store) => {
                  const sid = Number(store.id);
                  const active =
                    selectedStoreId !== null && sid === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => selectStore(sid)}
                      activeOpacity={0.75}
                      className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${
                        active
                          ? "border-primary bg-primary"
                          : "bg-white dark:border-neutral-600 dark:bg-neutral-800"
                      }`}
                    >
                      <Star
                        size={11}
                        color={active ? "#FFFFFF" : "#FF6600"}
                        fill={active ? "#FFFFFF" : "#FF6600"}
                      />
                      <Text
                        className={`max-w-[140px] text-xs font-poppins-semibold ${
                          active
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                        numberOfLines={1}
                      >
                        {store.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
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
          style={{ zIndex: 0 }}
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
