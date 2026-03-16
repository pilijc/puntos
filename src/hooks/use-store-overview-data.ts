import { rewards } from "@/data/rewards";
import { useCarouselAutoplayPause } from "@/hooks/use-carousel-autoplay-pause";
import { useLocation } from "@/hooks/use-location";
import { useRewardsActions } from "@/hooks/use-rewards-actions";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStamps } from "@/hooks/use-stamps";
import { getStores } from "@/services/store-service";
import { StampProgress } from "@/services/stamp-service";
import { useRewardsDataStore } from "@/store/user/rewards-data-store";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStoreStore } from "@/store/user/store-store";
import { sortRewards } from "@/utils/store-helpers";
import { distance, point } from "@turf/turf";
import { useCallback, useEffect, useMemo } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function buildVirtualStampEntry(focusedStore: any): StampProgress {
  return {
    id: -Number(focusedStore.id),
    user_id: "",
    store_id: Number(focusedStore.id),
    stamps_count: 0,
    target: 7,
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

export function useStoreOverviewData() {
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
  } = useRewardsDataStore();
  const { stores, setStores } = useStoreStore();
  const { location, startWatching, stopWatching } = useLocation();
  const { handleRefresh, hasStampedToday } = useRewardsActions();
  const { stamps } = useStamps();
  const { stampRewards } = useStampRewards();

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

  useEffect(() => {
    startWatching();
    return () => {
      stopWatching();
    };
  }, [startWatching, stopWatching]);

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

  const sortedRewards = useMemo(
    () => sortRewards(rewards, rewardSort, rewardPointsOrder).slice(0, 3),
    [rewardPointsOrder, rewardSort],
  );

  const isStoreNearby = useCallback((storeLat?: number | null, storeLon?: number | null) => {
    if (!location || storeLat == null || storeLon == null) return false;

    const from = point([location.longitude, location.latitude]);
    const to = point([storeLon, storeLat]);
    const distKm = distance(from, to, { units: "kilometers" });
    return distKm <= 0.03;
  }, [location]);

  const displayStamps = useMemo(() => {
    if (!location) return sortedStamps;

    if (nearbyStores.length === 0) return sortedStamps;

    const focusedStore = nearbyStores[heroIndex];
    if (!focusedStore) return [];

    const isEnabled = enabledStampFeatureStoreIds.includes(Number(focusedStore.id));
    if (!isEnabled) return [];

    const existingStamp = sortedStamps.find(
      (stamp) => Number(stamp.store_id) === Number(focusedStore.id),
    );

    return existingStamp ? [existingStamp] : [buildVirtualStampEntry(focusedStore)];
  }, [enabledStampFeatureStoreIds, heroIndex, location, nearbyStores, sortedStamps]);

  const displayStreaks = useMemo(() => {
    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      const isEligible = eligibleStreakStoreIds.includes(Number(focusedStore.id));
      if (!isEligible) return [];

      const existingStamp = sortedStamps.find(
        (stamp) => Number(stamp.store_id) === Number(focusedStore.id),
      );

      return existingStamp ? [existingStamp] : [buildVirtualStampEntry(focusedStore)];
    }

    return displayStamps.filter((stamp) =>
      eligibleStreakStoreIds.includes(Number(stamp.store_id)),
    );
  }, [displayStamps, eligibleStreakStoreIds, heroIndex, nearbyStores, sortedStamps]);

  useEffect(() => {
    const nearbyIds = nearbyStores.map((store) => Number(store.id));
    const displayStampStoreIds = sortedStamps.map((stamp) => Number(stamp.store_id));
    fetchRewardsData(nearbyIds, displayStampStoreIds);
  }, [fetchRewardsData, nearbyStores, sortedStamps]);

  useEffect(() => {
    setHeroIndex(0);
  }, [nearbyStores.length, setHeroIndex]);

  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: swipeIndicatorOpacity.value,
  }));

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
  };
}
