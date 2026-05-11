import { TextInput, RefreshControl, FlatList, View as RNView } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Search, Store, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useStoreStore } from "@/store/user/store-store";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useLocation } from "@/hooks/user/use-location";
import { useStreaks } from "@/hooks/use-streaks";
import UserStoreListItem from "@/components/users/stores/user-store-list-item";
import { buildStampedStoreList, type StampedStoreListItem } from "@/utils/store-helpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/supabase/supabase";

type ListRow =
  | { type: "header"; title: string }
  | { type: "item"; store: StampedStoreListItem; sectionDelay: number; section: "nearby" | "joined" | "discover" }
  | { type: "empty" };

export default function StoreListScreen() {
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  // storeFeatureFlags: Map<storeId, { stamp_enabled, streak_enabled }>
  // Fetched for ALL stores so discover stores can show/hide chevron correctly.
  const [storeFeatureFlags, setStoreFeatureFlags] = useState<
    Map<number, { stamp_enabled: boolean; streak_enabled: boolean }>
  >(new Map());
  const {
    storeSearchQuery: searchQuery,
    setStoreSearchQuery: setSearchQuery,
    refreshing,
    setRefreshing,
  } = useRewardsUiStore();
  const { stores: realStores } = useStoreStore();
  const { activeStampProgramRewards, eligibleStreakStoreIds, activeStreakProgramMap } = useRewardsDataStore();
  const { stamps, fetchStamps, refetch: refetchStamps } = useStamps();
  const { stampRewards, refetch: refetchStampRewards } = useStampRewards();
  const { location, refreshLocation } = useLocation();
  const { streaks: userStreaks, refetch: refetchStreaks } = useStreaks();

  // Refetch stamps, streaks & store_feature flags every time this tab comes into
  // focus so progress bars and chevrons always reflect the latest data.
  useFocusEffect(
    useCallback(() => {
      fetchStamps();
      refetchStreaks();
      // Batch-fetch store_feature for all stores (one cheap query)
      if (realStores.length > 0) {
        const allIds = realStores.map((s) => Number(s.id));
        supabase
          .from("store_feature")
          .select("store_id, stamp_enabled, streak_enabled")
          .in("store_id", allIds)
          .then(({ data }) => {
            const map = new Map<number, { stamp_enabled: boolean; streak_enabled: boolean }>();
            (data ?? []).forEach((row: any) => {
              map.set(Number(row.store_id), {
                stamp_enabled: row.stamp_enabled === true,
                streak_enabled: row.streak_enabled === true,
              });
            });
            setStoreFeatureFlags(map);
          });
      }
    }, [fetchStamps, refetchStreaks, realStores]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStamps(), refetchStampRewards(), refetchStreaks(), refreshLocation()]);
    setRefreshing(false);
  }, [refetchStamps, refetchStampRewards, refetchStreaks, refreshLocation, setRefreshing]);

  const allStores = useMemo(() => {
    // Build a Set of store IDs known to have an active streak program.
    // Union of eligibleStreakStoreIds (nearby, fetched by use-rewards-data)
    // and store IDs from the user's own streak rows (joined non-nearby).
    const streakStoreIdSet = new Set<number>([
      ...eligibleStreakStoreIds,
      ...userStreaks
        .filter((s) => s.store_streaks?.status === "active" || s.status === "in_progress")
        .map((s) => Number(s.store_id)),
    ]);
    return buildStampedStoreList(
      realStores,
      stamps,
      location,
      translate("user.rewards.unknownLocation"),
      stampRewards,
      activeStampProgramRewards,
      userStreaks,
      streakStoreIdSet,
      activeStreakProgramMap,
      storeFeatureFlags,
    );
  }, [location, realStores, stamps, translate, stampRewards, activeStampProgramRewards, userStreaks, eligibleStreakStoreIds, activeStreakProgramMap, storeFeatureFlags]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return allStores;
    return allStores.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allStores, searchQuery]);

  const { nearbyStoresSection, joinedStoresSection, discoverSection } = useMemo(() => ({
    nearbyStoresSection: filteredStores.filter((s) => s.isNearby),
    joinedStoresSection: filteredStores.filter((s) => !s.isNearby && s.isJoined),
    discoverSection: filteredStores.filter((s) => !s.isNearby && !s.isJoined),
  }), [filteredStores]);

  // Auto-expand progress bars when ≤ 2 nearby stores (fits on screen, no clutter)
  const defaultExpanded = nearbyStoresSection.length <= 2;

  // ── Virtualized flat list data ─────────────────────────────────────────────
  // Sections are flattened into a single array so FlatList only renders
  // items currently visible on screen (windowing / virtualization).
  const listData = useMemo((): ListRow[] => {
    if (filteredStores.length === 0) return [{ type: "empty" }];

    const rows: ListRow[] = [];
    const addSection = (
      items: StampedStoreListItem[],
      title: string,
      delay: number,
      section: "nearby" | "joined" | "discover",
    ) => {
      if (items.length === 0) return;
      rows.push({ type: "header", title });
      items.forEach((store) => rows.push({ type: "item", store, sectionDelay: delay, section }));
    };

    addSection(nearbyStoresSection, translate("user.rewards.storesList.nearbySection"), 0, "nearby");
    addSection(
      joinedStoresSection,
      translate("user.rewards.storesList.myStoresSection"),
      nearbyStoresSection.length * 80,
      "joined",
    );
    addSection(
      discoverSection,
      translate("user.rewards.storesList.discoverSection"),
      (nearbyStoresSection.length + joinedStoresSection.length) * 80,
      "discover",
    );

    return rows;
  }, [nearbyStoresSection, joinedStoresSection, discoverSection, filteredStores.length, translate]);

  const renderItem = useCallback(({ item }: { item: ListRow }) => {
    if (item.type === "header") {
      return (
        <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary px-6 mt-6 mb-1">
          {item.title}
        </Text>
      );
    }
    if (item.type === "empty") {
      return (
        <View className="items-center justify-center py-20 px-6">
          <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center mb-6">
            <Store size={48} color="#CBD5E1" />
          </View>
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white text-center">
            {searchQuery
              ? translate("user.rewards.storesList.noMatching")
              : translate("user.rewards.storesList.noJoined")}
          </Text>
          <Text className="text-sm text-neutral-500 font-poppins text-center px-10 mt-2">
            {searchQuery
              ? translate("user.rewards.storesList.noMatchingDetail", { query: searchQuery })
              : translate("user.rewards.storesList.noJoinedDetail")}
          </Text>
        </View>
      );
    }
    return (
      <View className="px-6 mb-3">
        <UserStoreListItem
          store={item.store}
          index={0}
          sectionDelay={item.sectionDelay}
          // Discover stores always start collapsed — user hasn't joined yet,
          // showing expanded progress would be noisy.
          defaultExpanded={item.section === "discover" ? false : defaultExpanded}
        />
      </View>
    );
  }, [defaultExpanded, searchQuery, translate]);

  const keyExtractor = useCallback((item: ListRow, index: number) => {
    if (item.type === "header") return `h-${item.title}`;
    if (item.type === "empty") return "empty";
    return `s-${item.store.id}`;
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-backgroundMuted dark:bg-darkBackground"
      edges={["left", "right"]}
    >
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 40),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6600"
            colors={["#FF6600"]}
          />
        }
        ListHeaderComponent={
          <View className="px-6 gap-y-4">
            <View className="flex-row justify-between items-center w-full ml-1 mt-2">
              <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                {translate("user.rewards.storesList.title")}
              </Text>
              <View className="w-10 h-10 opacity-0" />
            </View>
            <View className="flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-2xl px-4 py-1 border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none">
              <Search size={20} color="#9CA3AF" />
              <TextInput
                placeholder={translate("user.rewards.storesList.searchPlaceholder")}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 font-poppins text-sm text-neutral-900 dark:text-white pt-0 pb-0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ textAlignVertical: "center" }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
