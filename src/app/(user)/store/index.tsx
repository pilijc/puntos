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
import { getActiveStreakProgramsByStore, getStoresWithEnabledStreaks } from "@/services/stamp-service";

type ListRow =
  | { type: "header"; title: string }
  | { type: "item"; store: StampedStoreListItem; sectionDelay: number; section: "nearby" | "joined" | "discover" }
  | { type: "empty" };

export default function StoreListScreen() {
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  // storeFeatureFlags: Map<storeId, { stamp_enabled, streak_enabled }>
  // Covers discover stores (not nearby, no user data) so they can show the chevron.
  // streak_enabled here is the VISIBILITY flag only — streak_length comes from
  // activeStreakProgramMap (populated below via getActiveStreakProgramsByStore).
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
  const {
    activeStampProgramRewards,
    eligibleStreakStoreIds,
    activeStreakProgramMap,
    setActiveStreakProgramMap,
    setEligibleStreakStoreIds,
  } = useRewardsDataStore();
  const { stamps, fetchStamps, refetch: refetchStamps } = useStamps();
  const { stampRewards, refetch: refetchStampRewards } = useStampRewards();
  const { location, refreshLocation } = useLocation();
  const { streaks: userStreaks, refetch: refetchStreaks } = useStreaks();

  /**
   * ⚠️  IMPORTANT — DO NOT REMOVE THIS useFocusEffect
   *
   * Runs every time the Store tab comes into focus (e.g. after Back from detail).
   * Refreshes stamps/streaks AND populates program data for ALL stores so the list
   * shows correct 0/N progress for ALL sections (nearby / joined / discover).
   *
   * WHY storeFeatureFlags IS NEEDED (stamp_enabled / streak_enabled only):
   *   - use-rewards-data only fetches store_feature for NEARBY stores.
   *   - Discover stores have no other source for their enabled/disabled flags.
   *   - Without this, discover stores always show stampEnabled=false,
   *     streakProgramActive=false → no chevron.
   *
   * WHY getActiveStreakProgramsByStore IS CALLED HERE:
   *   - activeStreakProgramMap is normally only populated by fetchRewardsData
   *     which is only called from the store DETAIL screen.
   *   - On the list screen, activeStreakProgramMap is empty for stores the user
   *     hasn't visited yet → streakTarget = null → '0/?' in the chevron.
   *   - We call getActiveStreakProgramsByStore for ALL store IDs here and MERGE
   *     the results into the global activeStreakProgramMap (Zustand), so fallback
   *     2 in buildStampedStoreList resolves correctly for ALL stores.
   *
   * WHY getStoresWithEnabledStreaks IS CALLED HERE:
   *   - eligibleStreakStoreIds (from fetchRewardsData) only covers nearby stores.
   *   - Calling getStoresWithEnabledStreaks for ALL store IDs and merging into
   *     eligibleStreakStoreIds ensures the chevron appears correctly for joined
   *     and discover stores too.
   *
   * ⚠️  DO NOT convert to useEffect — must run on every focus, not just mount.
   * ⚠️  DO NOT remove getActiveStreakProgramsByStore call — it fixes the '0/?' bug.
   * ⚠️  DO NOT remove getStoresWithEnabledStreaks call — it fixes missing chevrons.
   */
  useFocusEffect(
    useCallback(() => {
      fetchStamps();
      refetchStreaks();

      if (realStores.length > 0) {
        const allIds = realStores.map((s) => Number(s.id));

        // 1. Fetch store_feature flags for ALL stores (cheap SELECT IN query).
        //    Provides stamp_enabled / streak_enabled visibility flags for discover stores.
        //    ⚠️ DO NOT remove — only source of feature flags for non-nearby/non-joined stores.
        supabase
          .from("store_feature")
          .select("store_id, stamp_enabled, streak_enabled")
          .in("store_id", allIds)
          .then(({ data, error }) => {
            if (error) {
              console.warn("[StoreList] store_feature fetch failed:", error.message);
              return;
            }
            const map = new Map<number, { stamp_enabled: boolean; streak_enabled: boolean }>();
            (data ?? []).forEach((row: any) => {
              map.set(Number(row.store_id), {
                stamp_enabled: row.stamp_enabled === true,
                streak_enabled: row.streak_enabled === true,
              });
            });
            setStoreFeatureFlags(map);
          });

        // 2. Fetch active streak programs for ALL stores and merge into global
        //    activeStreakProgramMap (Zustand). This is what fixes the '0/?' bug:
        //    buildStampedStoreList's fallback 2 reads from activeStreakProgramMap
        //    to get streak_length, but that map is only populated by fetchRewardsData
        //    (called from the detail screen). By populating it here for ALL stores,
        //    the list shows '0/7' immediately without requiring a detail screen visit.
        //    ⚠️ DO NOT remove — this is the primary fix for the '0/?' bug.
        getActiveStreakProgramsByStore(allIds)
          .then((newProgramMap) => {
            const current = useRewardsDataStore.getState().activeStreakProgramMap;
            const merged = new Map(current);
            newProgramMap.forEach((program, storeId) => merged.set(storeId, program));
            setActiveStreakProgramMap(merged);
          })
          .catch((err) => console.warn("[StoreList] getActiveStreakProgramsByStore failed:", err));

        // 3. Fetch eligible streak store IDs for ALL stores and merge into global
        //    eligibleStreakStoreIds. Ensures streakProgramActive=true for all sections.
        //    ⚠️ DO NOT remove — needed for streakProgramActive detection for all stores.
        getStoresWithEnabledStreaks(allIds)
          .then((ids) => {
            const current = useRewardsDataStore.getState().eligibleStreakStoreIds;
            const merged = Array.from(new Set([...current, ...ids]));
            setEligibleStreakStoreIds(merged);
          })
          .catch((err) => console.warn("[StoreList] getStoresWithEnabledStreaks failed:", err));
      }
    }, [fetchStamps, refetchStreaks, realStores, setActiveStreakProgramMap, setEligibleStreakStoreIds]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStamps(), refetchStampRewards(), refetchStreaks(), refreshLocation()]);
    setRefreshing(false);
  }, [refetchStamps, refetchStampRewards, refetchStreaks, refreshLocation, setRefreshing]);

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
      storeFeatureFlags, // ⚠️ DO NOT remove — covers discover stores (see store-helpers.ts header)
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
