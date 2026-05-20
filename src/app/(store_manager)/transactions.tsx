import { useTranslation } from "react-i18next";
import type { StoreRow } from "@/services/store-service";
import { formatTxTime } from "@/utils/store_manager/transaction";
import { useTransactions } from "@/hooks/store-manager/transaction";
import { TxType, ListItem } from "@/type/store-manager/transaction";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useStarredTxStores } from "@/hooks/store-manager/use-starred-tx-stores";
import {
  QrCode,
  Stamp,
  Flame,
  Funnel,
  Check,
  Star,
  X,
} from "lucide-react-native";
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
import {
  TransactionSkeleton,
  StoresAndFunnelSkeleton,
} from "@/components/skeleton/store_manager/transaction-skeleton";
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
  Alert,
} from "react-native";

const TYPE_META: Record<
  TxType,
  {
    color: string;
    bgLight: string;
    bgDark: string;
    icon: (c: string) => React.ReactNode;
  }
> = {
  qr: {
    color: "#FF6600",
    bgLight: "#FFF3E0",
    bgDark: "#431407",
    icon: (c) => <QrCode size={11} color={c} />,
  },
  stamp: {
    color: "#3B82F6",
    bgLight: "#EFF6FF",
    bgDark: "#1E3A5F",
    icon: (c) => <Stamp size={11} color={c} />,
  },
  streak: {
    color: "#8B5CF6",
    bgLight: "#F5F3FF",
    bgDark: "#2D1B69",
    icon: (c) => <Flame size={11} color={c} />,
  },
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
    stores,
    storesLoading,
    selectedStoreId,
    selectStore,
    typeFilter,
    setTypeFilter,
    loading,
    loadingMore,
    refreshing,
    listItems,
    hasMore,
    loadMore,
    handleRefresh,
  } = useTransactions();
  const availableStoreIdsKey = useMemo(
    () =>
      stores
        .map((s) => Number(s.id))
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b)
        .join(","),
    [stores],
  );
  const availableStoreIds = useMemo(
    () =>
      availableStoreIdsKey
        ? availableStoreIdsKey.split(",").map((id) => Number(id))
        : [],
    [availableStoreIdsKey],
  );
  const { starredIds, toggleStar, isStarred, canStarStore, maxStarred } =
    useStarredTxStores(availableStoreIds);
  const funnelRef = useRef<RNView>(null);
  const selectingStoreFromResultsRef = useRef(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [isStoreSearching, setIsStoreSearching] = useState(false);
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
      .map((id) => {
        const numId = Number(id);
        return (
          stores.find((s) => Number(s.id) === numId) ??
          (selectedStore && Number(selectedStore.id) === numId
            ? selectedStore
            : null)
        );
      })
      .filter((s): s is StoreRow => s != null);
  }, [starredIds, stores, selectedStore]);

  const isCurrentStoreStarred =
    selectedStoreId != null && isStarred(Number(selectedStoreId));
  const canStarCurrentStore =
    selectedStoreId != null && canStarStore(Number(selectedStoreId));

  const showStarLimitAlert = useCallback(() => {
    Alert.alert(
      translate("storeManager.transactions.storePicker.starLimitTitle"),
      translate("storeManager.transactions.storePicker.starLimitMessage", {
        max: maxStarred,
      }),
    );
  }, [translate, maxStarred]);

  const handleToggleStar = useCallback(
    (storeId: number) => {
      const id = Number(storeId);
      if (!isStarred(id) && !canStarStore(id)) {
        showStarLimitAlert();
        return;
      }
      const result = toggleStar(id);
      if (result === "limit_reached") {
        showStarLimitAlert();
      }
    },
    [canStarStore, isStarred, showStarLimitAlert, toggleStar],
  );

  const handleToggleCurrentStoreStar = useCallback(() => {
    if (selectedStoreId == null) return;
    handleToggleStar(Number(selectedStoreId));
  }, [selectedStoreId, handleToggleStar]);

  const filteredStoresForPicker = useMemo(() => {
    const q = storeSearchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) => s.name.toLowerCase().includes(q) || String(s.id).includes(q),
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

  const triggerColor = isDark ? "#737373" : "#94A3B8";

  const renderStorePickerRow = useCallback(
    ({ item }: ListRenderItemInfo<StoreRow>) => {
      const id = Number(item.id);
      const active = selectedStoreId !== null && id === selectedStoreId;
      const starred = isStarred(id);
      const canStar = canStarStore(id);
      return (
        <View className="flex-row items-center border-b border-slate-100 dark:border-darkBorder">
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
          <TouchableOpacity
            onPress={() => handleToggleStar(id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="shrink-0 items-center justify-center px-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={
              starred
                ? translate("storeManager.transactions.storePicker.removeStar")
                : translate("storeManager.transactions.storePicker.addStar")
            }
          >
            <Star
              size={16}
              color={starred ? "#FF6600" : canStar ? triggerColor : "#CBD5E1"}
              fill={starred ? "#FF6600" : "transparent"}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [
      selectStore,
      selectedStoreId,
      isStarred,
      canStarStore,
      stopSearching,
      handleToggleStar,
      translate,
      triggerColor,
    ],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === "header") {
        return (
          <View className={isWeb ? "pt-3 pb-2 w-full" : "px-6 pt-2 pb-1.5"}>
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
      const isLast =
        index === listItems.length - 1 ||
        listItems[index + 1]?.kind === "header";

      return (
        <View className={isWeb ? "w-full max-w-4xl self-center" : ""}>
          <View
            className={[
              "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground border-l border-r border-b border-slate-100 dark:border-darkBorder",
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
    [isDark, isWeb, listItems, translate],
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
  const triggerIcon =
    typeFilter === "qr" ? (
      <QrCode size={16} color={triggerColor} />
    ) : typeFilter === "stamp" ? (
      <Stamp size={16} color={triggerColor} />
    ) : typeFilter === "streak" ? (
      <Flame size={16} color={triggerColor} />
    ) : (
      <Funnel size={16} color={triggerColor} />
    );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackground"
    >
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
              ? "w-full items-center px-4 pb-3 pt-4"
              : "mb-1.5 w-full items-center px-4 pb-2 pt-3 dark:border-darkBorder"
          }
          style={{ position: "relative", zIndex: 100 }}
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
              className="w-full flex-row items-center gap-x-2 h-[42px]"
              style={{ zIndex: 50 }}
            >
              {stores.length > 1 ? (
                <View
                  className="min-w-0 flex-1 basis-0 h-[42px] rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground"
                  style={{ position: "relative", zIndex: 50 }}
                >
                  <RNView collapsable={false} className="w-full h-full">
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
                          height: 40,
                          paddingHorizontal: 12,
                          textAlignVertical: "center",
                          includeFontPadding: false,
                        },
                      ]}
                      className="text-sm font-poppins text-slate-900 dark:text-darkTextPrimary"
                    />
                  </RNView>

                  {showSearchResults ? (
                    <View
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-darkBorder dark:bg-darkBackgroundCard"
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
                <View
                  className="min-w-0 flex-1 basis-0 h-[42px] justify-center overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground"
                  style={{ paddingHorizontal: 12 }}
                >
                  <Text
                    className="text-xs font-poppins-semibold text-slate-800 dark:text-darkTextPrimary"
                    numberOfLines={1}
                  >
                    {selectedStore?.name ?? "—"}
                  </Text>
                </View>
              )}

              <View className="w-11 h-[42px] shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground">
                <TouchableOpacity
                  onPress={handleToggleCurrentStoreStar}
                  disabled={selectedStoreId == null}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  className="h-full w-full items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={
                    isCurrentStoreStarred
                      ? translate(
                          "storeManager.transactions.storePicker.removeStar",
                        )
                      : translate(
                          "storeManager.transactions.storePicker.addStar",
                        )
                  }
                >
                  <Star
                    size={16}
                    color={
                      isCurrentStoreStarred
                        ? "#FF6600"
                        : canStarCurrentStore
                          ? triggerColor
                          : "#CBD5E1"
                    }
                    fill={isCurrentStoreStarred ? "#FF6600" : "transparent"}
                  />
                </TouchableOpacity>
              </View>

              <View className="w-11 h-[42px] shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground">
                <RNView
                  ref={funnelRef}
                  collapsable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={handleFunnelOpen}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {triggerIcon}
                  </TouchableOpacity>
                </RNView>
              </View>
            </View>

            {starredStoresOrdered.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-2 w-full"
                contentContainerClassName="flex-row gap-x-2 py-0.5"
                keyboardShouldPersistTaps="handled"
              >
                {starredStoresOrdered.map((store) => {
                  const sid = Number(store.id);
                  const active =
                    selectedStoreId !== null && sid === selectedStoreId;
                  return (
                    <View
                      key={`starred-${sid}`}
                      className={`flex-row items-center rounded-full ${
                        active
                          ? "border border-primary bg-primary"
                          : "border border-transparent bg-white dark:border-darkBorder dark:bg-darkBackgroundCard"
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => selectStore(sid)}
                        activeOpacity={0.75}
                        className="flex-row items-center gap-1 py-1 pl-2.5 pr-1"
                        accessibilityRole="button"
                        accessibilityLabel={store.name}
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
                              : "text-slate-700 dark:text-darkTextPrimary"
                          }`}
                          numberOfLines={1}
                        >
                          {store.name}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          (
                            e as unknown as { stopPropagation?: () => void }
                          )?.stopPropagation?.();
                          handleToggleStar(sid);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                        activeOpacity={0.7}
                        className="items-center justify-center py-1 pl-1 pr-2"
                        accessibilityRole="button"
                        accessibilityLabel={translate(
                          "storeManager.transactions.storePicker.removeStar",
                        )}
                      >
                        <X size={12} color={active ? "#FFFFFF" : "#94A3B8"} />
                      </TouchableOpacity>
                    </View>
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
        <View
          className={isWeb ? "px-4 pb-4 items-center mt-4" : "px-4 pb-4 mt-4"}
        >
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
                  {translate(
                    "storeManager.transactions.empty.noTransactionsTitle",
                  )}
                </Text>
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary text-center px-8">
                  {translate(
                    "storeManager.transactions.empty.noTransactionsBody",
                  )}
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

      <Modal
        visible={funnelOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFunnelOpen(false)}
      >
        <Pressable
          className="absolute inset-0"
          onPress={() => setFunnelOpen(false)}
        />

        <View
          className="absolute z-50 w-[140px] overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-darkBorder dark:bg-darkBackgroundCard"
          style={{
            top: funnelAnchor.top,
            left: Math.min(
              funnelAnchor.left,
              Dimensions.get("window").width - 140 - 10,
            ),
          }}
        >
          {filterOptions.map((opt, idx) => {
            const isActive = opt.value === typeFilter;
            const isLast = idx === filterOptions.length - 1;

            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setTypeFilter(opt.value);
                  setFunnelOpen(false);
                }}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between px-3 py-2 ${!isLast ? "border-b border-slate-100 dark:border-darkBorder" : ""}`}
              >
                <Text
                  className={[
                    "text-[10px]",
                    isActive
                      ? "font-poppins-semibold text-primary"
                      : "font-poppins text-neutral-500 dark:text-darkTextMuted",
                  ].join(" ")}
                >
                  {opt.label}
                </Text>

                {isActive && <Check size={12} color="#FF6600" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
