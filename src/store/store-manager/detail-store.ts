import { create } from "zustand";
import { StoreDetail } from "@/type/store-manager/detail";

interface DetailStoreState {
  detail: StoreDetail | null;
  setDetail: (detail: StoreDetail | null) => void;
  reset: () => void;
}

export const useDetailStore = create<DetailStoreState>((set) => ({
  detail: null,
  setDetail: (detail) => set({ detail }),
  reset: () => set({ detail: null }),
}));
