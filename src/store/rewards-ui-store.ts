import { create } from "zustand";

export type RewardSort = "popular" | "points" | "newest";
export type StoreSort = "nearby" | "points" | "az";
export type PointsOrder = "desc" | "asc";

type RewardsUiState = {
  rewardSort: RewardSort;
  rewardPointsOrder: PointsOrder;
  storeSort: StoreSort;
  storePointsOrder: PointsOrder;
  setRewardSort: (sort: RewardSort) => void;
  setRewardPointsOrder: (order: PointsOrder) => void;
  setStoreSort: (sort: StoreSort) => void;
  setStorePointsOrder: (order: PointsOrder) => void;
  reset: () => void;
};

export const useRewardsUiStore = create<RewardsUiState>((set) => ({
  rewardSort: "popular",
  rewardPointsOrder: "desc",
  storeSort: "nearby",
  storePointsOrder: "desc",
  setRewardSort: (rewardSort) => set({ rewardSort }),
  setRewardPointsOrder: (rewardPointsOrder) => set({ rewardPointsOrder }),
  setStoreSort: (storeSort) => set({ storeSort }),
  setStorePointsOrder: (storePointsOrder) => set({ storePointsOrder }),
  reset: () =>
    set({
      rewardSort: "popular",
      rewardPointsOrder: "desc",
      storeSort: "nearby",
      storePointsOrder: "desc",
    }),
}));
