import { create } from "zustand";
import { ActiveStampProgramReward, ActiveStreakProgram, getActiveStampProgramRewards, getActiveStreakProgramsByStore, getStoresWithEnabledActiveStampProgram, getStoresWithEnabledStreaks, getUpcomingStreakProgramsByStore, UpcomingStreakProgram } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { Reward, getRewards, RewardSortOrder, PointsOrder } from "@/services/reward-service";
import { enrichStoresWithLocation, EnrichedStore } from "@/utils/store-location";
import { UserLocation } from "@/services/user/location-service";

interface RewardsDataState {
  eligibleNearbyStoreIds: number[];
  enabledStampFeatureStoreIds: number[];
  eligibleStreakStoreIds: number[];
  activeStampProgramRewards: ActiveStampProgramReward[];
  activeStreakProgramMap: Map<number, ActiveStreakProgram>; // storeId → full program
  upcomingStreakProgramMap: Map<number, UpcomingStreakProgram>; // storeId → upcoming streak
  backendRewards: Reward[];
  isLoadingRewardsFeatures: boolean;
  fetchedStoreIds: number[];
  
  setEligibleNearbyStoreIds: (ids: number[]) => void;
  setEnabledStampFeatureStoreIds: (ids: number[]) => void;
  setEligibleStreakStoreIds: (ids: number[]) => void;
  setActiveStampProgramRewards: (rewards: ActiveStampProgramReward[]) => void;
  setBackendRewards: (rewards: Reward[]) => void;
  setActiveStreakProgramMap: (map: Map<number, ActiveStreakProgram>) => void;
  setUpcomingStreakProgramMap: (map: Map<number, UpcomingStreakProgram>) => void;
  
  fetchRewardsData: (nearbyStoreIds: number[], displayStampStoreIds: number[]) => Promise<void>;
  fetchBackendRewards: (options: { storeId?: string; sortBy?: RewardSortOrder; pointsOrder?: PointsOrder; limit?: number }) => Promise<void>;
  
  // Selectors/Utilities
  getEnrichedStores: (allStores: any[], location: UserLocation | null) => EnrichedStore[];
  getFilteredStores: (allStores: any[], location: UserLocation | null, query: string) => EnrichedStore[];
  
  reset: () => void;
}

export const useRewardsDataStore = create<RewardsDataState>((set, get) => ({
  eligibleNearbyStoreIds: [],
  enabledStampFeatureStoreIds: [],
  eligibleStreakStoreIds: [],
  activeStampProgramRewards: [],
  activeStreakProgramMap: new Map(),
  upcomingStreakProgramMap: new Map(),
  backendRewards: [],
  isLoadingRewardsFeatures: false,
  fetchedStoreIds: [],

  setEligibleNearbyStoreIds: (eligibleNearbyStoreIds) => set({ eligibleNearbyStoreIds }),
  setEnabledStampFeatureStoreIds: (enabledStampFeatureStoreIds) => set({ enabledStampFeatureStoreIds }),
  setEligibleStreakStoreIds: (eligibleStreakStoreIds) => set({ eligibleStreakStoreIds }),
  setActiveStampProgramRewards: (activeStampProgramRewards) => set({ activeStampProgramRewards }),
  setBackendRewards: (backendRewards) => set({ backendRewards }),
  setActiveStreakProgramMap: (activeStreakProgramMap) => set({ activeStreakProgramMap }),
  setUpcomingStreakProgramMap: (upcomingStreakProgramMap) => set({ upcomingStreakProgramMap }),

  fetchRewardsData: async (nearbyStoreIds, displayStampStoreIds) => {
    // Filter out NaN or invalid IDs before starting
    nearbyStoreIds = (nearbyStoreIds ?? []).filter(id => typeof id === 'number' && !isNaN(id));
    displayStampStoreIds = (displayStampStoreIds ?? []).filter(id => typeof id === 'number' && !isNaN(id));

    const { fetchedStoreIds } = get();
    // Stale-While-Revalidate constraint: only trigger hard skeleton if new stores haven't been fetched
    const fetchRequiresSkeletons = !nearbyStoreIds.every((id) => fetchedStoreIds.includes(id));
    if (fetchRequiresSkeletons) {
      set({ isLoadingRewardsFeatures: true });
    }

    if (nearbyStoreIds.length === 0 && displayStampStoreIds.length === 0) {
      set({
        eligibleNearbyStoreIds: [],
        enabledStampFeatureStoreIds: [],
        eligibleStreakStoreIds: [],
        activeStampProgramRewards: [],
        isLoadingRewardsFeatures: false,
      });
      return;
    }

    try {
      const allStreakStoreIds = Array.from(new Set([...nearbyStoreIds, ...displayStampStoreIds]));

      const p1 = nearbyStoreIds.length > 0
        ? getStoresWithEnabledActiveStampProgram(nearbyStoreIds)
        : Promise.resolve([]);

      const p2 = nearbyStoreIds.length > 0
        ? supabase
            .from("store_feature")
            .select("store_id, stamp_enabled")
            .in("store_id", nearbyStoreIds)
            .then(({ data }) => {
              return (data || [])
                .filter((row: any) => row.stamp_enabled === true)
                .map((row: any) => Number(row.store_id));
            })
        : Promise.resolve([]);

      const p3 = getStoresWithEnabledStreaks(allStreakStoreIds);

      const p4 = displayStampStoreIds.length > 0
        ? getActiveStampProgramRewards(displayStampStoreIds)
        : Promise.resolve([]);

      const p5 = getActiveStreakProgramsByStore(allStreakStoreIds);

      const p6 = getUpcomingStreakProgramsByStore(allStreakStoreIds);

      // Wrap each promise with an individual timeout so a single slow query
      // doesn't abort the whole set. We still collect partial results.
      const wrapWithTimeout = async <T>(p: Promise<T>, name: string, ms = 15000) => {
        const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms));
        try {
          const v = await Promise.race([p, timeout]);
          return { ok: true as const, value: v };
        } catch (err) {
          console.warn(`[fetchRewardsData] ${name} failed:`, err);
          return { ok: false as const, error: err };
        }
      };

      const wrapped = await Promise.all([
        wrapWithTimeout(p1, 'getStoresWithEnabledActiveStampProgram'),
        wrapWithTimeout(p2, 'store_feature_query'),
        wrapWithTimeout(p3, 'getStoresWithEnabledStreaks'),
        wrapWithTimeout(p4, 'getActiveStampProgramRewards'),
        wrapWithTimeout(p5, 'getActiveStreakProgramsByStore'),
        wrapWithTimeout(p6, 'getUpcomingStreakProgramsByStore'),
      ]);

      // Convert wrapped results into the original results array shape, using
      // empty fallbacks when a query failed or timed out.
      const results = [
        wrapped[0].ok ? wrapped[0].value : [],
        wrapped[1].ok ? wrapped[1].value : [],
        wrapped[2].ok ? wrapped[2].value : [],
        wrapped[3].ok ? wrapped[3].value : [],
        wrapped[4].ok ? wrapped[4].value : new Map(),
        wrapped[5].ok ? wrapped[5].value : new Map(),
      ];

      const newFetchedIds = Array.from(new Set([...fetchedStoreIds, ...nearbyStoreIds]));

      // Merge results without overwriting existing cached store data
      const { 
        eligibleNearbyStoreIds: currentNearby,
        enabledStampFeatureStoreIds: currentFeatures,
        eligibleStreakStoreIds: currentStreaks,
        activeStampProgramRewards: currentRewards
      } = get();

      // Merge results
      const safeNearby = currentNearby.filter(id => !nearbyStoreIds.includes(id));
      const safeFeatures = currentFeatures.filter(id => !nearbyStoreIds.includes(id));
      const allRequestedIds = [...nearbyStoreIds, ...displayStampStoreIds];
      const safeStreaks = currentStreaks.filter(id => !allRequestedIds.includes(id));
      const safeRewards = currentRewards.filter(r => !displayStampStoreIds.includes(r.store_id));

      // Merge streak program map
      const { activeStreakProgramMap: currentMap, upcomingStreakProgramMap: currentUpcomingStreak } = get();
      const newStreakMap = new Map<number, ActiveStreakProgram>(currentMap);
      // Clear requested IDs to remove stale programs (e.g. if a feature was disabled)
      allRequestedIds.forEach((id) => newStreakMap.delete(id));
      const fetchedStreakMap = results[4] as Map<number, ActiveStreakProgram>;
      fetchedStreakMap.forEach((program, storeId) => newStreakMap.set(storeId, program));

      // Merge upcoming streak program map
      const newUpcomingStreakMap = new Map<number, UpcomingStreakProgram>(currentUpcomingStreak);
      // Clear requested IDs to remove stale programs
      allRequestedIds.forEach((id) => newUpcomingStreakMap.delete(id));
      const fetchedUpcomingStreak = results[5] as Map<number, UpcomingStreakProgram>;
      fetchedUpcomingStreak.forEach((program, storeId) => newUpcomingStreakMap.set(storeId, program));
      // Remove stores that now have active programs (they should no longer show as upcoming)
      newStreakMap.forEach((_, storeId) => newUpcomingStreakMap.delete(storeId));

      set({
        eligibleNearbyStoreIds: [...safeNearby, ...results[0]],
        enabledStampFeatureStoreIds: [...safeFeatures, ...results[1]],
        eligibleStreakStoreIds: [...safeStreaks, ...results[2]],
        activeStampProgramRewards: [...safeRewards, ...results[3]],
        activeStreakProgramMap: newStreakMap,
        upcomingStreakProgramMap: newUpcomingStreakMap,
        isLoadingRewardsFeatures: false,
        fetchedStoreIds: newFetchedIds,
      });
    } catch (error) {
      console.error("Failed to fetch rewards data in store:", error);
      set({ isLoadingRewardsFeatures: false });
    }
  },

  fetchBackendRewards: async (options) => {
    try {
      const rewards = await getRewards(options);
      set({ backendRewards: rewards });
    } catch (error) {
      console.error("Failed to fetch backend rewards:", error);
    }
  },

  getEnrichedStores: (allStores, location) => {
    return enrichStoresWithLocation(allStores, location);
  },

  getFilteredStores: (allStores, location, query) => {
    const enriched = enrichStoresWithLocation(allStores, location);
    if (!query) return enriched;
    return enriched.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.address || "").toLowerCase().includes(query.toLowerCase())
    );
  },

  reset: () => set({
    eligibleNearbyStoreIds: [],
    enabledStampFeatureStoreIds: [],
    eligibleStreakStoreIds: [],
    activeStampProgramRewards: [],
    activeStreakProgramMap: new Map(),
    upcomingStreakProgramMap: new Map(),
    backendRewards: [],
    fetchedStoreIds: [],
  }),
}));
