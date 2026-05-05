import { create } from "zustand";
import { RewardState } from "@/type/store-manager/reward";

export const useRewardStore = create<RewardState>((set) => ({
  title: "",
  description: "",
  points_cost: 0,
  image_url: "",
  stock: 0,
  titleError: false,
  imageError: false,
  pointsCostError: false,
  stockError: false,

  setTitle: (value: string) => set({ title: value }),
  setDescription: (value) => set({ description: value }),
  setPointsCost: (value: number) => set({ points_cost: value }),
  setImageUrl: (value: string) => set({ image_url: value }),
  setStock: (value: number) => set({ stock: value }),
  setTitleError: (value: boolean) => set({ titleError: value }),
  setImageError: (value: boolean) => set({ imageError: value }),
  setPointsCostError: (value: boolean) => set({ pointsCostError: value }),
  setStockError: (value: boolean) => set({ stockError: value }),
  reset: () => set({
    title: "",
    description: "",
    points_cost: 0,
    image_url: "",
    stock: 0,
    titleError: false,
    imageError: false,
    pointsCostError: false,
    stockError: false,
  }),
}));
