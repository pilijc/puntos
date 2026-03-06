import { StampStore } from "@/type/store-manager/stamp";
import { create } from "zustand";

export const useStampStore = create<StampStore>((set) => ({
  total_stamps: 0,
  reward_id: "",
  setTotalStamps: (total_stamps: number) => set({ total_stamps }),
  setRewardId: (reward_id: string) => set({ reward_id }),
  reset: () => set({ total_stamps: 0, reward_id: "" }),
}));    