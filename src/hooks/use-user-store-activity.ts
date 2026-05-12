import { create } from "zustand";
import { supabase } from "@/supabase/supabase";
import { getUserAvailablePoints } from "@/services/user/points-service";
import { getUserTransactionHistory } from "@/services/user/qr-service";
import { getRewards, RewardSortOrder, PointsOrder } from "@/services/reward-service";

interface UserStoreActivityState {
  pointsMap: Record<string, number>;
  transactionsMap: Record<string, any[]>;
  rewardsMap: Record<string, any[]>;
  isLoading: Record<string, boolean>;
  isLoadingRewards: Record<string, boolean>;
  hasFetchedOnce: Record<string, boolean>;
  hasFetchedRewardsOnce: Record<string, boolean>;
  
  fetchActivity: (storeId: string) => Promise<void>;
  refetchActivity: (storeId: string) => Promise<void>;
  fetchRewardsActivity: (storeId: string, sortBy: RewardSortOrder, pointsOrder: PointsOrder) => Promise<void>;
}

export const useUserStoreActivity = create<UserStoreActivityState>((set, get) => ({
  pointsMap: {},
  transactionsMap: {},
  rewardsMap: {},
  isLoading: {},
  isLoadingRewards: {},
  hasFetchedOnce: {},
  hasFetchedRewardsOnce: {},

  fetchActivity: async (storeId: string) => {
    if (!get().hasFetchedOnce[storeId]) {
      set((state) => ({ isLoading: { ...state.isLoading, [storeId]: true } }));
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        set((state) => ({ isLoading: { ...state.isLoading, [storeId]: false }, hasFetchedOnce: { ...state.hasFetchedOnce, [storeId]: true } }));
        return;
      }

      const [points, transactions] = await Promise.all([
        getUserAvailablePoints(session.user.id, storeId),
        getUserTransactionHistory(session.user.id, storeId, 3),
      ]);

      set((state) => ({
        pointsMap: { ...state.pointsMap, [storeId]: points },
        transactionsMap: { ...state.transactionsMap, [storeId]: transactions },
        isLoading: { ...state.isLoading, [storeId]: false },
        hasFetchedOnce: { ...state.hasFetchedOnce, [storeId]: true },
      }));
    } catch (error) {
      console.error("Failed to fetch store activity:", error);
      set((state) => ({ isLoading: { ...state.isLoading, [storeId]: false }, hasFetchedOnce: { ...state.hasFetchedOnce, [storeId]: true } }));
    }
  },

  fetchRewardsActivity: async (storeId: string, sortBy: RewardSortOrder, pointsOrder: PointsOrder) => {
    const cacheKey = `${storeId}-${sortBy}-${pointsOrder}`;
    
    if (!get().hasFetchedRewardsOnce[cacheKey]) {
      set((state) => ({ isLoadingRewards: { ...state.isLoadingRewards, [cacheKey]: true } }));
    }

    try {
      const rewards = await getRewards({
        storeId,
        sortBy,
        pointsOrder,
        limit: 20,
      });

      set((state) => ({
        rewardsMap: { ...state.rewardsMap, [cacheKey]: rewards },
        isLoadingRewards: { ...state.isLoadingRewards, [cacheKey]: false },
        hasFetchedRewardsOnce: { ...state.hasFetchedRewardsOnce, [cacheKey]: true },
      }));
    } catch (error) {
      console.error("Failed to fetch store rewards:", error);
      set((state) => ({ isLoadingRewards: { ...state.isLoadingRewards, [cacheKey]: false }, hasFetchedRewardsOnce: { ...state.hasFetchedRewardsOnce, [cacheKey]: true } }));
    }
  },

  refetchActivity: async (storeId: string) => {
    await get().fetchActivity(storeId);
    // Note: We don't forcefully refetch rewards here to keep the API clean, 
    // as rewards refetching is currently handled by useRewardsDataStore / fetchBackendRewards
  }
}));
