import { create } from "zustand";
import type { StampConfigureViewState, StampStore, StampViewState } from "@/type/store-manager/stamp";

export const useStampStore = create<StampStore>((set) => ({
  total_stamps: 0,
  reward_id: "",
  expiration_mode: "none",
  expiration_days: 30,
  setTotalStamps: (total_stamps) => set({ total_stamps }),
  setRewardId: (reward_id) => set({ reward_id }),
  setExpirationMode: (expiration_mode) => set({ expiration_mode }),
  setExpirationDays: (expiration_days) => set({ expiration_days }),
  reset: () => set({ total_stamps: 0, reward_id: "", expiration_mode: "none", expiration_days: 30 }),
}));

export const useStampViewStore = create<StampViewState>((set) => ({
  activeTab: "draft",
  stamps: [],
  rewards: [],
  loading: true,
  endingId: null,
  modal: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setStamps: (stamps) => set({ stamps }),
  setRewards: (rewards) => set({ rewards }),
  setLoading: (loading) => set({ loading }),
  setEndingId: (endingId) => set({ endingId }),
  setModal: (modal) => set({ modal }),
}));

export const useStampConfigureViewStore = create<StampConfigureViewState>((set) => ({
  isSubmitting: false,
  checkingActive: true,
  rewards: [],
  modal: null,
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setCheckingActive: (checkingActive) => set({ checkingActive }),
  setRewards: (rewards) => set({ rewards }),
  setModal: (modal) => set({ modal }),
}));
