import { StoreFeature } from "@/type/store-manager/features";
import { create } from "zustand";

type FeaturesStore = {
    feature: StoreFeature | null;
    setFeature: (feature: StoreFeature) => void;
    resetFeatures: () => void;
};

export const useFeaturesStore = create<FeaturesStore>((set) => ({
    feature: null,
    setFeature: (feature) => set({ feature }),
    resetFeatures: () => set({ feature: null }),
}));
