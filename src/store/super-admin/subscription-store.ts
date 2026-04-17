import { create } from "zustand";
import type {
  ManagerSubscriptionPaymentRow,
  ManagerSubscriptionRow,
  PublicUserRow,
  SubscriptionPlan,
} from "@/type/super-admin/subscription";

type SubscriptionStoreState = {
  plans: SubscriptionPlan[];
  managerSubscriptions: ManagerSubscriptionRow[];
  publicUsers: Record<string, PublicUserRow>;
  paymentsByOwner: Record<string, ManagerSubscriptionPaymentRow[]>;
  paymentsOpen: Record<string, boolean>;
  paymentsLoading: Record<string, boolean>;
  proAmountInput: string;
  savedProAmount: number | null;
  formError: string | null;
  loading: boolean;
  saving: boolean;
  showSuccessModal: boolean;

  setPlans: (plans: SubscriptionPlan[]) => void;
  setManagerSubscriptions: (rows: ManagerSubscriptionRow[]) => void;
  setPublicUsers: (rows: PublicUserRow[]) => void;
  setPaymentsForOwner: (ownerId: string, rows: ManagerSubscriptionPaymentRow[]) => void;
  setPaymentsOpen: (ownerId: string, open: boolean) => void;
  setPaymentsLoading: (ownerId: string, loading: boolean) => void;
  setProAmountInput: (value: string) => void;
  setSavedProAmount: (value: number | null) => void;
  setFormError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  setSaving: (value: boolean) => void;
  setShowSuccessModal: (value: boolean) => void;
  reset: () => void;
};

export const useSuperAdminSubscriptionStore = create<SubscriptionStoreState>((set) => ({
  plans: [],
  managerSubscriptions: [],
  publicUsers: {},
  paymentsByOwner: {},
  paymentsOpen: {},
  paymentsLoading: {},
  proAmountInput: "",
  savedProAmount: null,
  formError: null,
  loading: false,
  saving: false,
  showSuccessModal: false,

  setPlans: (plans) => set({ plans }),
  setManagerSubscriptions: (rows) => set({ managerSubscriptions: rows }),
  setPublicUsers: (rows) =>
    set({
      publicUsers: rows.reduce<Record<string, PublicUserRow>>((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {}),
    }),
  setPaymentsForOwner: (ownerId, rows) =>
    set((state) => ({
      paymentsByOwner: { ...state.paymentsByOwner, [ownerId]: rows },
    })),
  setPaymentsOpen: (ownerId, open) =>
    set((state) => ({
      paymentsOpen: { ...state.paymentsOpen, [ownerId]: open },
    })),
  setPaymentsLoading: (ownerId, loading) =>
    set((state) => ({
      paymentsLoading: { ...state.paymentsLoading, [ownerId]: loading },
    })),
  setProAmountInput: (value) => set({ proAmountInput: value }),
  setSavedProAmount: (value) => set({ savedProAmount: value }),
  setFormError: (value) => set({ formError: value }),
  setLoading: (value) => set({ loading: value }),
  setSaving: (value) => set({ saving: value }),
  setShowSuccessModal: (value) => set({ showSuccessModal: value }),

  reset: () =>
    set({
      plans: [],
      managerSubscriptions: [],
      publicUsers: {},
      paymentsByOwner: {},
      paymentsOpen: {},
      paymentsLoading: {},
      proAmountInput: "",
      savedProAmount: null,
      formError: null,
      loading: false,
      saving: false,
      showSuccessModal: false,
    }),
}));