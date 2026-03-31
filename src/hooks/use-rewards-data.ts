import { create } from "zustand";
import { ActiveStampProgramReward, getActiveStampProgramRewards, getActiveStreakProgramsByStore, getStoresWithEnabledActiveStampProgram, getStoresWithEnabledStreaks } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { Reward, getRewards, RewardSortOrder, PointsOrder } from "@/services/reward-service";
import { enrichStoresWithLocation, EnrichedStore } from "@/utils/store-location";
import { UserLocation } from "@/services/location-service";

interface RewardsDataState {
  eligibleNearbyStoreIds: number[];
  enabledStampFeatureStoreIds: number[];
  eligibleStreakStoreIds: number[];
  activeStampProgramRewards: ActiveStampProgramReward[];
  activeStreakProgramMap: Map<number, number>; // storeId → streakProgramId
  backendRewards: Reward[];
  isLoadingRewardsFeatures: boolean;
  fetchedStoreIds: number[];
  
  setEligibleNearbyStoreIds: (ids: number[]) => void;
  setEnabledStampFeatureStoreIds: (ids: number[]) => void;
  setEligibleStreakStoreIds: (ids: number[]) => void;
  setActiveStampProgramRewards: (rewards: ActiveStampProgramReward[]) => void;
  setBackendRewards: (rewards: Reward[]) => void;
  setActiveStreakProgramMap: (map: Map<number, number>) => void;
  
  fetchRewardsData: (nearbyStoreIds: number[], displayStampStoreIds: number[]) => Promise<void>;
  fetchBackendRewards: (options: { storeId?: string; sortBy?: RewardSortOrder; pointsOrder?: PointsOrder }) => Promise<void>;
  
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
  backendRewards: [],
  isLoadingRewardsFeatures: false,
  fetchedStoreIds: [],

  setEligibleNearbyStoreIds: (eligibleNearbyStoreIds) => set({ eligibleNearbyStoreIds }),
  setEnabledStampFeatureStoreIds: (enabledStampFeatureStoreIds) => set({ enabledStampFeatureStoreIds }),
  setEligibleStreakStoreIds: (eligibleStreakStoreIds) => set({ eligibleStreakStoreIds }),
  setActiveStampProgramRewards: (activeStampProgramRewards) => set({ activeStampProgramRewards }),
  setBackendRewards: (backendRewards) => set({ backendRewards }),
  setActiveStreakProgramMap: (activeStreakProgramMap) => set({ activeStreakProgramMap }),

  fetchRewardsData: async (nearbyStoreIds, displayStampStoreIds) => {
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
      const results = await Promise.all([
        nearbyStoreIds.length > 0 ? getStoresWithEnabledActiveStampProgram(nearbyStoreIds) : Promise.resolve([]),
        nearbyStoreIds.length > 0 ? supabase
          .from("store_feature")
          .select("store_id, stamp_enabled")
          .in("store_id", nearbyStoreIds)
          .then(({ data }) => 
            (data || [])
              .filter((row: any) => row.stamp_enabled === true)
              .map((row: any) => Number(row.store_id))
          ) : Promise.resolve([]),
        getStoresWithEnabledStreaks(allStreakStoreIds),
        displayStampStoreIds.length > 0 ? getActiveStampProgramRewards(displayStampStoreIds) : Promise.resolve([]),
        getActiveStreakProgramsByStore(allStreakStoreIds),
      ]);

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
      const { activeStreakProgramMap: currentMap } = get();
      const newStreakMap = new Map<number, number>(currentMap);
      const fetchedStreakMap = results[4] as Map<number, number>;
      fetchedStreakMap.forEach((programId, storeId) => newStreakMap.set(storeId, programId));

      set({
        eligibleNearbyStoreIds: [...safeNearby, ...results[0]],
        enabledStampFeatureStoreIds: [...safeFeatures, ...results[1]],
        eligibleStreakStoreIds: [...safeStreaks, ...results[2]],
        activeStampProgramRewards: [...safeRewards, ...results[3]],
        activeStreakProgramMap: newStreakMap,
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
    backendRewards: [],
    fetchedStoreIds: [],
  }),
}));
