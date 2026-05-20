import { RefreshControl, FlatList, View as RNView } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Search, Store, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useStoreStore } from "@/store/user/store-store";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useLocation } from "@/hooks/user/use-location";
import { useStreaks } from "@/hooks/use-streaks";
import UserStoreListItem from "@/components/users/stores/user-store-list-item";
import { buildStampedStoreList, type StampedStoreListItem } from "@/utils/store-helpers";
import { supabase } from "@/supabase/supabase";

import { useStoreFeaturesQuery, useActiveStreakProgramsQuery, useEnabledStreaksQuery } from "@/hooks/user/rq/store-queries";
import { useCurrentUserProfileQuery } from "@/hooks/user/rq/profile-queries";
import { useStampsQuery } from "@/hooks/user/rq/stamp-queries";

type ListRow =
  | { type: "header"; title: string }
  | { type: "item"; store: StampedStoreListItem; sectionDelay: number; section: "nearby" | "joined" | "discover" }
  | { type: "empty" };

export default function StoreListScreen() {
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const {
    storeSearchQuery: searchQuery,
    setStoreSearchQuery: setSearchQuery,
    refreshing,
    setRefreshing,
  } = useRewardsUiStore();
  const { stores: realStores } = useStoreStore();
  
  // Note: activeStampProgramRewards, eligibleStreakStoreIds, and activeStreakProgramMap 
  // from useRewardsDataStore are still used for nearby stores. 
  // However, we now merge them locally with the RQ hooks for Discover stores.
  const {
    activeStampProgramRewards,
    eligibleStreakStoreIds,
    activeStreakProgramMap,
  } = useRewardsDataStore();
  
  const { stampRewards, refetch: refetchStampRewards } = useStampRewards();
  const { location, refreshLocation } = useLocation();
  const { streaks: userStreaks, refetch: refetchStreaks } = useStreaks();

  const { data: profileData } = useCurrentUserProfileQuery();
  const userId = profileData?.user?.id;
  const { data: stamps = [], refetch: refetchStampsQuery } = useStampsQuery(userId);

  const allIds = useMemo(() => realStores.map((s) => Number(s.id)), [realStores]);

  const { data: storeFeatureFlags = new Map(), refetch: refetchFeatures } = useStoreFeaturesQuery(allIds);
  const { data: rqActiveStreakMap = new Map(), refetch: refetchActiveStreaks } = useActiveStreakProgramsQuery(allIds);
  const { data: rqEnabledStreaks = [], refetch: refetchEnabledStreaks } = useEnabledStreaksQuery(allIds);

  const mergedStreakProgramMap = useMemo(() => {
    const merged = new Map(activeStreakProgramMap);
    rqActiveStreakMap.forEach((program, storeId) => merged.set(storeId, program));
    return merged;
  }, [activeStreakProgramMap, rqActiveStreakMap]);

  const mergedEligibleStreakStoreIds = useMemo(() => {
    return Array.from(new Set([...eligibleStreakStoreIds, ...rqEnabledStreaks]));
  }, [eligibleStreakStoreIds, rqEnabledStreaks]);

  /**
   * Run every time the Store tab comes into focus.
   * Refreshes dynamic user data (streaks, stamps) and RQ features.
   */
  useFocusEffect(
    useCallback(() => {
      refetchStampsQuery();
      refetchStreaks();
      refetchFeatures();
      refetchActiveStreaks();
      refetchEnabledStreaks();
    }, [refetchStampsQuery, refetchStreaks, refetchFeatures, refetchActiveStreaks, refetchEnabledStreaks]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStampsQuery(), 
      refetchStampRewards(), 
      refetchStreaks(), 
      refetchFeatures(),
      refetchActiveStreaks(),
      refetchEnabledStreaks(),
      refreshLocation()
    ]);
    setRefreshing(false);
  }, [refetchStampsQuery, refetchStampRewards, refetchStreaks, refetchFeatures, refetchActiveStreaks, refetchEnabledStreaks, refreshLocation, setRefreshing]);

  const allStores = useMemo(() => {
    /**
     * streakStoreIdSet: union of two sources for "has active streak program".
     *
     * Source 1 — eligibleStreakStoreIds (from use-rewards-data):
     *   Nearby stores where streak_enabled=true AND an active store_streaks row exists.
     *   Fetched by the geofence-triggered fetchRewardsData call.
     *
     * Source 2 — userStreaks (from useStreaks):
     *   Stores where the user already has a user_streaks row with status=active
     *   or in_progress. Covers JOINED non-nearby stores the user has started.
     *
     * Together these cover:
     *   - Nearby stores     → source 1
     *   - Started non-nearby → source 2
     *   - Discover stores    → storeFeatureFlags (handled inside buildStampedStoreList)
     *
     * ⚠️  DO NOT collapse these into a single source. Each covers a different case.
     */
    const streakStoreIdSet = new Set<number>([
      ...mergedEligibleStreakStoreIds,
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
      mergedStreakProgramMap,
      storeFeatureFlags,
    );
  }, [location, realStores, stamps, translate, stampRewards, activeStampProgramRewards, userStreaks, mergedEligibleStreakStoreIds, mergedStreakProgramMap, storeFeatureFlags]);

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
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 font-poppins text-center px-10 mt-2">
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
      edges={["top", "left", "right"]}
    >
      <View className="bg-white dark:bg-darkBackgroundMuted border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row justify-between items-center">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          {translate("user.rewards.storesList.title")}
        </Text>
        <View className="w-10 h-10 opacity-0" />
      </View>

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
          paddingTop: 16,
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
          <View className="px-6 mb-4">
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
