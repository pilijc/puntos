import { create } from "zustand";
import type { ModalButton } from "@/components/modal";

export type StoreManagerSubscriptionModal = {
  title: string;
  message: string;
  buttons: ModalButton[];
} | null;

type StoreManagerSubscriptionState = {
  startingCheckout: boolean;
  cancellingSubscription: boolean;
  modal: StoreManagerSubscriptionModal;

  setStartingCheckout: (starting: boolean) => void;
  setCancellingSubscription: (cancelling: boolean) => void;
  setModal: (modal: StoreManagerSubscriptionModal) => void;
  clearModal: () => void;
  showMessage: (title: string, message: string) => void;
  reset: () => void;
};

export const useStoreManagerSubscriptionStore = create<StoreManagerSubscriptionState>((set, get) => ({
  startingCheckout: false,
  cancellingSubscription: false,
  modal: null,

  setStartingCheckout: (startingCheckout) => set({ startingCheckout }),
  setCancellingSubscription: (cancellingSubscription) => set({ cancellingSubscription }),
  setModal: (modal) => set({ modal }),
  clearModal: () => set({ modal: null }),
  showMessage: (title, message) =>
    set({
      modal: {
        title,
        message,
        buttons: [{ label: "OK", variant: "primary", onPress: () => get().clearModal() }],
      },
    }),

  reset: () =>
    set({
      startingCheckout: false,
      cancellingSubscription: false,
      modal: null,
    }),
}));
