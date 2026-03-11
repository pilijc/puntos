import { StampStore } from "@/type/store-manager/stamp";
import { create } from "zustand";

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
