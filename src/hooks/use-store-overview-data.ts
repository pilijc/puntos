import { RewardItem, rewards } from "@/data/rewards";
import { getRewards } from "@/services/reward-service";
import { getUserAvailablePoints } from "@/services/user/points-service";
import { mapBackendRewardsToRewardItems } from "@/utils/user/reward-mappers";
import { supabase } from "@/supabase/supabase";
import { useCarouselAutoplayPause } from "@/hooks/use-carousel-autoplay-pause";
import { useLocation } from "@/hooks/user/use-location";
import { useRewardsActions } from "@/hooks/use-rewards-actions";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStamps } from "@/hooks/use-stamps";
import { useStreaks } from "@/hooks/use-streaks";
import { getStores } from "@/services/store-service";
import { StampProgress } from "@/services/stamp-service";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStoreStore } from "@/store/user/store-store";
import { getHasStampedToday, sortRewards } from "@/utils/store-helpers";
import { distance, point } from "@turf/turf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function buildVirtualStampEntry(focusedStore: any, targetStamps: number = 7): StampProgress {
  return {
    id: -Number(focusedStore.id),
    user_id: "",
    store_id: Number(focusedStore.id),
    stamps_count: 0,
    target: targetStamps,
    last_stamp_at: "",
    updated_at: "",
    stores: {
      name: focusedStore.name,
      logo: focusedStore.logo ?? undefined,
      status: focusedStore.status,
      is_active: focusedStore.is_active,
      latitude: focusedStore.latitude ?? undefined,
      longitude: focusedStore.longitude ?? undefined,
      address: focusedStore.address ?? undefined,
    },
  };
}

export function useStoreOverviewData(storeId?: string) {
  const {
    rewardSort,
    rewardPointsOrder,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    heroIndex,
    setHeroIndex,
  } = useRewardsUiStore();
  const {
    enabledStampFeatureStoreIds,
    eligibleStreakStoreIds,
    activeStampProgramRewards,
    fetchRewardsData,
    getEnrichedStores,
    isLoadingRewardsFeatures,
    fetchedStoreIds,
    activeStreakProgramMap,
    upcomingStreakProgramMap,
  } = useRewardsDataStore();
  const { stores, setStores } = useStoreStore();
  const { location } = useLocation();
  const { handleRefresh } = useRewardsActions();
  const { stamps } = useStamps();
  const { stampRewards } = useStampRewards();
  const { streaks: userStreaks, refetch: refetchStreaks } = useStreaks();

  // State for dynamic rewards
  const [storeRewards, setStoreRewards] = useState<RewardItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);

  const handleCarouselInteraction = useCarouselAutoplayPause(setIsAutoPlayEnabled);
  const swipeIndicatorOpacity = useSharedValue(0);

  const fetchActiveStores = useCallback(async () => {
    try {
      const data = await getStores();
      setStores(data ?? []);
    } catch (error) {
      console.error("Failed to load stores in Store tab:", error);
    }
  }, [setStores]);

  useEffect(() => {
    fetchActiveStores();
  }, [fetchActiveStores]);

  const storesWithLocation = useMemo(
    () => getEnrichedStores(stores, location),
    [getEnrichedStores, location, stores],
  );

  const nearbyStores = useMemo(
    () => storesWithLocation.filter((store) => store.isNearby),
    [storesWithLocation],
  );

  useEffect(() => {
    if (nearbyStores.length >= 2) {
      swipeIndicatorOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.2, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      swipeIndicatorOpacity.value = 0;
    }
  }, [nearbyStores.length, swipeIndicatorOpacity]);

  const sortedStamps = useMemo(() => {
    if (!location) return stamps;
    const userPoint = point([location.longitude, location.latitude]);

    return [...stamps].sort((a, b) => {
      const storeA = a.stores as { latitude?: number; longitude?: number } | undefined;
      const storeB = b.stores as { latitude?: number; longitude?: number } | undefined;

      let distanceA = Infinity;
      let distanceB = Infinity;

      if (storeA?.latitude != null && storeA?.longitude != null) {
        distanceA = distance(
          userPoint,
          point([storeA.longitude, storeA.latitude]),
          { units: "kilometers" },
        );
      }

      if (storeB?.latitude != null && storeB?.longitude != null) {
        distanceB = distance(
          userPoint,
          point([storeB.longitude, storeB.latitude]),
          { units: "kilometers" },
        );
      }

      return distanceA - distanceB;
    });
  }, [location, stamps]);

  // Fetch rewards and user points
  useEffect(() => {
    async function fetchStoreRewards() {
      if (!storeId) return;

      setIsLoadingRewards(true);
      try {
        // Fetch rewards for this store
        const rewards = await getRewards({
          storeId,
          sortBy: rewardSort,
          pointsOrder: rewardPointsOrder,
          limit: 3,
        });

        // Fetch user points for this store
        let points = 0;
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          points = await getUserAvailablePoints(user.id, storeId);
          setUserPoints(points);
        }

        // Map to RewardItem with status
        const mappedRewards = mapBackendRewardsToRewardItems(rewards, points);
        setStoreRewards(mappedRewards);
      } catch (error) {
        console.error("Failed to fetch store rewards:", error);
        setStoreRewards([]);
      } finally {
        setIsLoadingRewards(false);
      }
    }

    fetchStoreRewards();
  }, [storeId, rewardSort, rewardPointsOrder]);

  const sortedRewards = useMemo(() => storeRewards, [storeRewards]);

  const isStoreNearby = useCallback((storeLat?: number | null, storeLon?: number | null) => {
    if (!location || storeLat == null || storeLon == null) return false;

    const from = point([location.longitude, location.latitude]);
    const to = point([storeLon, storeLat]);
    const distKm = distance(from, to, { units: "kilometers" });
    return distKm <= 0.03;
  }, [location]);

  const displayStamps = useMemo(() => {
    // Helper: only show a stamp card if the store has an ACTIVE stamp program
    const getActiveProgram = (id: number) =>
      activeStampProgramRewards.find((r) => Number(r.store_id) === id);

    // If a specific storeId is requested, we only want to show that one
    if (storeId) {
      const targetStore = storesWithLocation.find((s) => s.id.toString() === storeId);
      if (!targetStore) return [];

      const isEnabled = enabledStampFeatureStoreIds.includes(Number(targetStore.id));
      const activeProgram = getActiveProgram(Number(targetStore.id));
      if (!isEnabled || !activeProgram) return [];

      const existingStamp = sortedStamps.find(
        (stamp) => Number(stamp.store_id) === Number(targetStore.id),
      );

      return existingStamp ? [existingStamp] : [buildVirtualStampEntry(targetStore, activeProgram.total_stamps)];
    }

    if (!location) return sortedStamps.filter(s => getActiveProgram(Number(s.store_id)));

    if (nearbyStores.length === 0) return sortedStamps.filter(s => getActiveProgram(Number(s.store_id)));

    const focusedStore = nearbyStores[heroIndex];
    if (!focusedStore) return [];

    const isEnabled = enabledStampFeatureStoreIds.includes(Number(focusedStore.id));
    const activeProgram = getActiveProgram(Number(focusedStore.id));
    if (!isEnabled || !activeProgram) return [];

    const existingStamp = sortedStamps.find(
      (stamp) => Number(stamp.store_id) === Number(focusedStore.id),
    );

    return existingStamp ? [existingStamp] : [buildVirtualStampEntry(focusedStore, activeProgram.total_stamps)];
  }, [activeStampProgramRewards, enabledStampFeatureStoreIds, heroIndex, location, nearbyStores, sortedStamps, storeId, storesWithLocation]);

  const displayStreaks = useMemo(() => {
    // Helper: a streak entry is only eligible to display if the attached
    // store_streaks program is still active (defense-in-depth against stale cache).
    const hasActiveProgram = (storeId: number) =>
      activeStreakProgramMap.has(storeId);

    // If a specific storeId is requested, focus only on its real streak record
    if (storeId) {
      const isEligible = eligibleStreakStoreIds.includes(Number(storeId));
      // Also verify the program is still active (guards stale eligibleStreakStoreIds cache)
      if (!isEligible || !hasActiveProgram(Number(storeId))) return [];

      // ── Program-aware lookup ──────────────────────────────────────────────
      // When a store switches to a new streak program (Program A → Program B),
      // the old user_streaks record (linked to Program A's ID) must not surface
      // as the user's current progress. We match on BOTH store_id AND the current
      // active program ID. If the record belongs to an old program, we fall through
      // and return the virtual 0-progress entry so the reset is visible immediately.
      const currentProgram = activeStreakProgramMap.get(Number(storeId));
      const existingStreak = userStreaks.find(
        (s) =>
          Number(s.store_id) === Number(storeId) &&
          (currentProgram == null || s.store_streak_id === currentProgram.id),
      );
      if (existingStreak) return [existingStreak];

      // No record for this program yet — build a virtual 0-progress entry.
      // IMPORTANT: pass store_streaks so the circle classifier has start_at/end_date
      // and can correctly mark pre-program days instead of falling through to "missed".
      const targetStore = storesWithLocation.find((s) => s.id.toString() === storeId);
      if (!targetStore) return [];
      return [{
        id: -Number(targetStore.id),
        user_id: "",
        store_id: Number(targetStore.id),
        streak_days: 0,
        last_activity_date: "",
        total_earned_days: 0,
        points_earned: 0,
        completion_bonus_awarded: false,
        completed_at: null,
        status: null,
        store_streak_id: currentProgram?.id ?? null,
        store_streaks: currentProgram ?? null,
        stores: {
          name: targetStore.name,
          logo: targetStore.logo ?? undefined,
          address: targetStore.address ?? undefined,
          status: targetStore.status,
          is_active: targetStore.is_active,
        },
      }];
    }

    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      const isEligible = eligibleStreakStoreIds.includes(Number(focusedStore.id));
      // Also verify the program is still active (guards stale eligibleStreakStoreIds cache)
      if (!isEligible || !hasActiveProgram(Number(focusedStore.id))) return [];

      // ── Program-aware lookup (same logic as the storeId-specific path above) ──
      const currentProgram2 = activeStreakProgramMap.get(Number(focusedStore.id));
      const existingStreak = userStreaks.find(
        (s) =>
          Number(s.store_id) === Number(focusedStore.id) &&
          (currentProgram2 == null || s.store_streak_id === currentProgram2.id),
      );
      if (existingStreak) return [existingStreak];

      // No record for the current program yet — virtual 0-progress entry with full program data
      return [{
        id: -Number(focusedStore.id),
        user_id: "",
        store_id: Number(focusedStore.id),
        streak_days: 0,
        last_activity_date: "",
        total_earned_days: 0,
        points_earned: 0,
        completion_bonus_awarded: false,
        completed_at: null,
        status: null,
        store_streak_id: currentProgram2?.id ?? null,
        store_streaks: currentProgram2 ?? null,
        stores: {
          name: focusedStore.name,
          logo: focusedStore.logo ?? undefined,
          address: focusedStore.address ?? undefined,
          status: focusedStore.status,
          is_active: focusedStore.is_active,
        },
      }];
    }

    // Fallback: show all streaks for eligible stores that also have an active program
    return userStreaks.filter((s) =>
      eligibleStreakStoreIds.includes(Number(s.store_id)) &&
      hasActiveProgram(Number(s.store_id)),
    );
  }, [activeStreakProgramMap, eligibleStreakStoreIds, heroIndex, nearbyStores, storeId, storesWithLocation, userStreaks]);

  const prevFetchParams = useRef<string | null>(null);

  useEffect(() => {
    const nearbyIds = nearbyStores.map((store) => Number(store.id));
    const displayStampStoreIds = sortedStamps.map((stamp) => Number(stamp.store_id));
    
    // Ensure we fetch feature flags for out-of-range Discover stores when viewing their details
    if (storeId && !nearbyIds.includes(Number(storeId))) {
      nearbyIds.push(Number(storeId));
    }

    // Ensure reward program is fetched for the focused store even when the user has
    // no stamp_progress row yet (virtual card path — after erasure or first visit)
    if (storeId && !displayStampStoreIds.includes(Number(storeId))) {
      displayStampStoreIds.push(Number(storeId));
    }
    
    const currentParams = JSON.stringify({
      nearbyIds: [...nearbyIds].sort(),
      displayStampStoreIds: [...displayStampStoreIds].sort(),
    });

    if (prevFetchParams.current !== currentParams) {
      prevFetchParams.current = currentParams;
      fetchRewardsData(nearbyIds, displayStampStoreIds);
    }
  }, [fetchRewardsData, nearbyStores, sortedStamps, storeId]);

  useEffect(() => {
    if (storeId) {
      const index = nearbyStores.findIndex((s) => s.id.toString() === storeId);
      if (index !== -1) {
        setHeroIndex(index);
      } else {
        setHeroIndex(0);
      }
    } else {
      setHeroIndex(0);
    }
  }, [nearbyStores, setHeroIndex, storeId]);

  // ─── Upcoming program banners ──────────────────────────────────────────────
  // Show the upcoming banner for the focused store when there is no active program.
  const upcomingStreak = useMemo(() => {
    const focusedId = storeId
      ? Number(storeId)
      : nearbyStores[heroIndex]
        ? Number(nearbyStores[heroIndex].id)
        : null;
    if (focusedId == null) return null;
    // Only show "upcoming" if there is NO active program for this store
    if (activeStreakProgramMap.has(focusedId)) return null;
    return upcomingStreakProgramMap.get(focusedId) ?? null;
  }, [activeStreakProgramMap, heroIndex, nearbyStores, storeId, upcomingStreakProgramMap]);

  const swipeIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: swipeIndicatorOpacity.value,
    };
  });

  // Compute hasStampedToday for the focused store
  const hasStampedToday = useMemo(() => {
    const focusedStore = storeId
      ? storesWithLocation.find((s) => s.id.toString() === storeId)
      : nearbyStores[heroIndex];
    if (!focusedStore) return false;
    const storeStamp = stamps.find((s) => Number(s.store_id) === Number(focusedStore.id));
    return getHasStampedToday(storeStamp?.last_stamp_at);
  }, [stamps, storeId, nearbyStores, heroIndex, storesWithLocation]);

  return {
    activeStampProgramRewards,
    handleCarouselInteraction,
    handleRefresh,
    hasStampedToday,
    isAutoPlayEnabled,
    isStoreNearby,
    nearbyStores,
    sortedRewards,
    stampRewards,
    storesWithLocation,
    displayStamps,
    displayStreaks,
    swipeIndicatorStyle,
    isLoadingRewardsFeatures,
    fetchedStoreIds,
    refetchStreaks,
    upcomingStreak,
    isLoadingRewards,
    userPoints,
  };
}
