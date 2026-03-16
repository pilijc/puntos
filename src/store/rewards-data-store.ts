import { create } from "zustand";
import { ActiveStampProgramReward, getActiveStampProgramRewards, getStoresWithEnabledActiveStampProgram, getStoresWithEnabledStreaks } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { Reward, getRewards, RewardSortOrder, PointsOrder } from "@/services/reward-service";
import { enrichStoresWithLocation, EnrichedStore } from "@/utils/store-location";
import { UserLocation } from "@/services/location-service";

interface RewardsDataState {
  eligibleNearbyStoreIds: number[];
  enabledStampFeatureStoreIds: number[];
  eligibleStreakStoreIds: number[];
  activeStampProgramRewards: ActiveStampProgramReward[];
  backendRewards: Reward[];
  
  setEligibleNearbyStoreIds: (ids: number[]) => void;
  setEnabledStampFeatureStoreIds: (ids: number[]) => void;
  setEligibleStreakStoreIds: (ids: number[]) => void;
  setActiveStampProgramRewards: (rewards: ActiveStampProgramReward[]) => void;
  setBackendRewards: (rewards: Reward[]) => void;
  
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
  backendRewards: [],

  setEligibleNearbyStoreIds: (eligibleNearbyStoreIds) => set({ eligibleNearbyStoreIds }),
  setEnabledStampFeatureStoreIds: (enabledStampFeatureStoreIds) => set({ enabledStampFeatureStoreIds }),
  setEligibleStreakStoreIds: (eligibleStreakStoreIds) => set({ eligibleStreakStoreIds }),
  setActiveStampProgramRewards: (activeStampProgramRewards) => set({ activeStampProgramRewards }),
  setBackendRewards: (backendRewards) => set({ backendRewards }),

  fetchRewardsData: async (nearbyStoreIds, displayStampStoreIds) => {
    if (nearbyStoreIds.length === 0 && displayStampStoreIds.length === 0) {
      set({
        eligibleNearbyStoreIds: [],
        enabledStampFeatureStoreIds: [],
        eligibleStreakStoreIds: [],
        activeStampProgramRewards: [],
      });
      return;
    }

    try {
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
        getStoresWithEnabledStreaks(Array.from(new Set([...nearbyStoreIds, ...displayStampStoreIds]))),
        displayStampStoreIds.length > 0 ? getActiveStampProgramRewards(displayStampStoreIds) : Promise.resolve([]),
      ]);

      set({
        eligibleNearbyStoreIds: results[0],
        enabledStampFeatureStoreIds: results[1],
        eligibleStreakStoreIds: results[2],
        activeStampProgramRewards: results[3],
      });
    } catch (error) {
      console.error("Failed to fetch rewards data in store:", error);
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
    backendRewards: [],
  }),
}));
