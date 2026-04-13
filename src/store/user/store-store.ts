import { Store_Superadmin, StoreState, StoreState_Superadmin } from "@/type/user/store";
import { create } from "zustand";

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  mutedStoreIds: [],
  setStores: (stores) => set({ stores }),
  setMutedStoreIds: (mutedStoreIds) => set({ mutedStoreIds }),
  reset: () => set({ stores: [] }),
}));

export const useStoreStore_Superadmin = create<StoreState_Superadmin>((set) => ({
  stores: [],
  setStores: (stores: Store_Superadmin[]) => set({ stores }),
  reset: () => set({ stores: [] }),
}));