import { create } from "zustand";
import { RewardState, RewardType } from "@/type/store-manager/reward";

export const useRewardStore = create<RewardState>((set) => ({
  title: "",
  description: "",
  points_cost: 0,
  image_url: "",
  type: "streak",

  setTitle: (value: string) => set({ title: value }),
  setDescription: (value) => set({ description: value }),
  setPointsCost:  (value: number) => set({ points_cost: value }),
  setImageUrl:    (value: string) => set({ image_url: value }),
  setType: (value: RewardType) => set({ type: value }),
  reset: () => set({
    title: "",
    description: "",
    points_cost: 0,
    image_url: "",
    type: "streak",
  }),
}));
