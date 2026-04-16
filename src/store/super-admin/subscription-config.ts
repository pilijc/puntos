import { create } from "zustand";

interface SubscriptionConfigState {
  ENFORCE_SUBSCRIPTION: boolean;
  FREE_STORES_LIMIT: number;
  LIMIT_MESSAGE: string;
  SUBSCRIPTION_PRICE_PHP: number;
  SUBSCRIPTION_START: string;
  SUBSCRIPTION_END: string;
  /** Store manager user ids (UUID) flagged for subscription enforcement (super admin). */
  enforced_owner_ids: string[];
  updateLimit: (limit: number) => void;
  updateMessage: (message: string) => void;
  updatePrice: (price: number) => void;
  updateStartDate: (date: string) => void;
  updateEndDate: (date: string) => void;
  toggleEnforce: (enforce: boolean) => void;
  toggleOwnerEnforcement: (ownerId: string, enforced: boolean) => void;
  setEnforcedOwners: (ownerIds: string[]) => void;
}

export const useSubscriptionConfigStore = create<SubscriptionConfigState>((set) => ({
  ENFORCE_SUBSCRIPTION: true,
  FREE_STORES_LIMIT: 1,
  LIMIT_MESSAGE:
    "This Store Manager has reached the limit of free stores. Approving this store will require a subscription charge.",
  SUBSCRIPTION_PRICE_PHP: 500,
  SUBSCRIPTION_START: "",
  SUBSCRIPTION_END: "",
  enforced_owner_ids: [],
  updateLimit: (limit) => set({ FREE_STORES_LIMIT: limit }),
  updateMessage: (message) => set({ LIMIT_MESSAGE: message }),
  updatePrice: (price) => set({ SUBSCRIPTION_PRICE_PHP: price }),
  updateStartDate: (date) => set({ SUBSCRIPTION_START: date }),
  updateEndDate: (date) => set({ SUBSCRIPTION_END: date }),
  toggleEnforce: (enforce) => set({ ENFORCE_SUBSCRIPTION: enforce }),
  toggleOwnerEnforcement: (ownerId, enforced) =>
    set((state) => ({
      enforced_owner_ids: enforced
        ? [...state.enforced_owner_ids.filter((id) => id !== ownerId), ownerId]
        : state.enforced_owner_ids.filter((id) => id !== ownerId),
    })),
  setEnforcedOwners: (ownerIds) => set({ enforced_owner_ids: ownerIds }),
}));
