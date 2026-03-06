import { StoreFeature } from "@/type/features";
import { create } from "zustand";

type FeaturesStore = {
    features: StoreFeature[];
    setFeatures: (features: StoreFeature[]) => void;
    reset: () => void;
};

export const useFeaturesStore = create<FeaturesStore>((set) => ({
    features: [],
    setFeatures: (features) => set({ features }),
    reset: () => set({ features: [] }),
}));