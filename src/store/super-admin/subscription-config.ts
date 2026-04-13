import { create } from "zustand";

interface SubscriptionConfigState {
  ENFORCE_SUBSCRIPTION: boolean;
  FREE_STORES_LIMIT: number;
  LIMIT_MESSAGE: string;
  SUBSCRIPTION_PRICE_PHP: number;
  SUBSCRIPTION_START: string;
  SUBSCRIPTION_END: string;
  enforced_stores_ids: number[];
  updateLimit: (limit: number) => void;
  updateMessage: (message: string) => void;
  updatePrice: (price: number) => void;
  updateStartDate: (date: string) => void;
  updateEndDate: (date: string) => void;
  toggleEnforce: (enforce: boolean) => void;
  toggleStoreEnforcement: (storeId: number, enforced: boolean) => void;
}

export const useSubscriptionConfigStore = create<SubscriptionConfigState>((set) => ({
  ENFORCE_SUBSCRIPTION: true,
  FREE_STORES_LIMIT: 2,
  LIMIT_MESSAGE: "This Store Manager has reached the limit of free stores. Approving this store will generate a subscription charge.",
  SUBSCRIPTION_PRICE_PHP: 500,
  SUBSCRIPTION_START: "",
  SUBSCRIPTION_END: "",
  enforced_stores_ids: [],
  updateLimit: (limit) => set({ FREE_STORES_LIMIT: limit }),
  updateMessage: (message) => set({ LIMIT_MESSAGE: message }),
  updatePrice: (price) => set({ SUBSCRIPTION_PRICE_PHP: price }),
  updateStartDate: (date) => set({ SUBSCRIPTION_START: date }),
  updateEndDate: (date) => set({ SUBSCRIPTION_END: date }),
  toggleEnforce: (enforce) => set({ ENFORCE_SUBSCRIPTION: enforce }),
  toggleStoreEnforcement: (storeId, enforced) => set((state) => ({
    enforced_stores_ids: enforced 
      ? [...state.enforced_stores_ids.filter(id => id !== storeId), storeId]
      : state.enforced_stores_ids.filter(id => id !== storeId)
  })),
}));
