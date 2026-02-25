import { Store, StoreState } from "@/type/store";
import { create } from "zustand";

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  setStores: (stores) => set({ stores }),
  reset: () => set({ stores: [] }),
}));