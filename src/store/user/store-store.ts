import { Store_Superadmin, StoreState, StoreState_Superadmin } from "@/type/user/store";
import { create } from "zustand";

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  mutedStoreIds: [],
  isMutedStoresHydrated: false,
  setStores: (stores) => set({ stores }),
  setMutedStoreIds: (update) =>
    set((state) => ({
      mutedStoreIds: typeof update === "function" ? update(state.mutedStoreIds) : update,
    })),
  setMutedStoresHydrated: (isMutedStoresHydrated) => set({ isMutedStoresHydrated }),
  reset: () => set({ stores: [], mutedStoreIds: [], isMutedStoresHydrated: false }),
}));

export const useStoreStore_Superadmin = create<StoreState_Superadmin>((set) => ({
  stores: [],
  setStores: (stores: Store_Superadmin[]) => set({ stores }),
  reset: () => set({ stores: [] }),
}));