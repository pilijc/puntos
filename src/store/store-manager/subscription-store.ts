import { create } from "zustand";
import type { ModalButton } from "@/components/modal";
import type {
  ManagerSubscriptionPaymentRow,
  ManagerSubscriptionRow,
} from "@/services/store-manager/subscription-service";

export type StoreManagerSubscriptionModal = {
  title: string;
  message: string;
  buttons: ModalButton[];
} | null;

type StoreManagerSubscriptionState = {
  ownerId: string | null;
  plans: Array<Record<string, unknown>>;
  managerRow: ManagerSubscriptionRow | null;
  invoices: ManagerSubscriptionPaymentRow[];
  loading: boolean;
  loadingInvoices: boolean;
  startingCheckout: boolean;
  cancellingSubscription: boolean;
  modal: StoreManagerSubscriptionModal;

  setLoading: (loading: boolean) => void;
  setLoadingInvoices: (loading: boolean) => void;
  setStartingCheckout: (starting: boolean) => void;
  setCancellingSubscription: (cancelling: boolean) => void;
  setModal: (modal: StoreManagerSubscriptionModal) => void;
  clearModal: () => void;
  showMessage: (title: string, message: string) => void;
  hydrate: (payload: {
    ownerId: string;
    plans: Array<Record<string, unknown>>;
    managerRow: ManagerSubscriptionRow | null;
    invoices: ManagerSubscriptionPaymentRow[];
  }) => void;
  reset: () => void;
};

const initialData = {
  ownerId: null as string | null,
  plans: [] as Array<Record<string, unknown>>,
  managerRow: null as ManagerSubscriptionRow | null,
  invoices: [] as ManagerSubscriptionPaymentRow[],
};

export const useStoreManagerSubscriptionStore = create<StoreManagerSubscriptionState>((set, get) => ({
  ...initialData,
  loading: true,
  loadingInvoices: false,
  startingCheckout: false,
  cancellingSubscription: false,
  modal: null,

  setLoading: (loading) => set({ loading }),
  setLoadingInvoices: (loadingInvoices) => set({ loadingInvoices }),
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

  hydrate: ({ ownerId, plans, managerRow, invoices }) =>
    set({
      ownerId,
      plans,
      managerRow,
      invoices,
      loadingInvoices: false,
    }),

  reset: () =>
    set({
      ...initialData,
      loading: true,
      loadingInvoices: false,
      startingCheckout: false,
      cancellingSubscription: false,
      modal: null,
    }),
}));
