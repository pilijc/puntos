import { create } from "zustand";

export type RewardSort = "popular" | "points" | "newest";
export type StoreSort = "nearby" | "points" | "az";
export type PointsOrder = "desc" | "asc";

type RewardsUiState = {
  rewardSort: RewardSort;
  rewardPointsOrder: PointsOrder;
  storeSort: StoreSort;
  storePointsOrder: PointsOrder;
  isNearbyOpen: boolean;
  isStampLogOpen: boolean;
  carouselIndex: number;
  heroIndex: number;
  isAutoPlayEnabled: boolean;
  isStamping: boolean;
  refreshing: boolean;
  storeSearchQuery: string;
  setRewardSort: (sort: RewardSort) => void;
  setRewardPointsOrder: (order: PointsOrder) => void;
  setStoreSort: (sort: StoreSort) => void;
  setStorePointsOrder: (order: PointsOrder) => void;
  setIsNearbyOpen: (isOpen: boolean) => void;
  setIsStampLogOpen: (isOpen: boolean) => void;
  setCarouselIndex: (index: number) => void;
  setHeroIndex: (index: number) => void;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  setIsStamping: (isStamping: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setStoreSearchQuery: (query: string) => void;
  reset: () => void;
};

export const useRewardsUiStore = create<RewardsUiState>((set) => ({
  rewardSort: "popular",
  rewardPointsOrder: "desc",
  storeSort: "nearby",
  storePointsOrder: "desc",
  isNearbyOpen: false,
  isStampLogOpen: false,
  carouselIndex: 0,
  heroIndex: 0,
  isAutoPlayEnabled: true,
  isStamping: false,
  refreshing: false,
  storeSearchQuery: "",
  setRewardSort: (rewardSort) => set({ rewardSort }),
  setRewardPointsOrder: (rewardPointsOrder) => set({ rewardPointsOrder }),
  setStoreSort: (storeSort) => set({ storeSort }),
  setStorePointsOrder: (storePointsOrder) => set({ storePointsOrder }),
  setIsNearbyOpen: (isNearbyOpen) => set({ isNearbyOpen }),
  setIsStampLogOpen: (isStampLogOpen) => set({ isStampLogOpen }),
  setCarouselIndex: (carouselIndex) => set({ carouselIndex }),
  setHeroIndex: (heroIndex) => set({ heroIndex }),
  setIsAutoPlayEnabled: (isAutoPlayEnabled) => set({ isAutoPlayEnabled }),
  setIsStamping: (isStamping) => set({ isStamping }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setStoreSearchQuery: (storeSearchQuery) => set({ storeSearchQuery }),
  reset: () =>
    set({
      rewardSort: "popular",
      rewardPointsOrder: "desc",
      storeSort: "nearby",
      storePointsOrder: "desc",
      isNearbyOpen: false,
      isStampLogOpen: false,
      carouselIndex: 0,
      heroIndex: 0,
      isAutoPlayEnabled: true,
      isStamping: false,
      refreshing: false,
      storeSearchQuery: "",
    }),
}));
