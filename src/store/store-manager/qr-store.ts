import { create } from "zustand";
import type { ModalButton } from "@/components/modal";
import { getQRConfig } from "@/services/store-manager/qr-service";
import { QRPurchaseStore } from "@/type/store-manager/qr.purchase";

type QRConfig = Awaited<ReturnType<typeof getQRConfig>>;

type QRModalState = {
  title: string;
  message: string;
  buttons: ModalButton[];
} | null;

type QRViewState = {
  config: QRConfig | null;
  loading: boolean;
  refreshing: boolean;
  toggling: boolean;
  deleting: boolean;
  modal: QRModalState;
  errors: {
    percentage: boolean;
    percentageErrorMessage: string;
    baseAmount: boolean;
    baseAmountErrorMessage: string;
    fixedPoints: boolean;
    fixedPointsErrorMessage: string;
    minimumSpend: boolean;
    minimumSpendErrorMessage: string;
    maxPointsPerTxn: boolean;
    maxPointsPerTxnErrorMessage: string;
  };
  lastLoadedStoreId: string | null;
  hasLoadedOnceForStore: boolean;
  lastFetchAttemptStoreId: string | null;
  lastFetchAttemptAt: number | null;
  setConfig: (config: QRConfig | null) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setToggling: (toggling: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setModal: (modal: QRModalState) => void;
  setErrors: (errors: {
    percentage: boolean;
    percentageErrorMessage: string;
    baseAmount: boolean;
    baseAmountErrorMessage: string;
    fixedPoints: boolean;
    fixedPointsErrorMessage: string;
    minimumSpend: boolean;
    minimumSpendErrorMessage: string;
    maxPointsPerTxn: boolean;
    maxPointsPerTxnErrorMessage: string;
  }) => void;
  setLastLoadedStoreId: (storeId: string | null) => void;
  setHasLoadedOnceForStore: (hasLoadedOnce: boolean) => void;
  setLastFetchAttemptStoreId: (storeId: string | null) => void;
  setLastFetchAttemptAt: (ts: number | null) => void;
};

export const useQRStore = create<QRPurchaseStore & QRViewState>((set) => ({
  store_id: "",
  percentage: 0,
  base_amount: 0,
  earning_type: "percentage",
  fixed_points: 0,  
  minimum_spend: 0,
  max_points_per_txn: 0,
  active: false,

  config: null,
  loading: true,
  refreshing: false,
  toggling: false,
  deleting: false,
  modal: null,
  errors: {
    percentage: false,
    percentageErrorMessage: "",
    baseAmount: false,
    baseAmountErrorMessage: "",
    fixedPoints: false,
    fixedPointsErrorMessage: "",
    minimumSpend: false,
    minimumSpendErrorMessage: "",
    maxPointsPerTxn: false,
    maxPointsPerTxnErrorMessage: "",
  },
  lastLoadedStoreId: null,
  hasLoadedOnceForStore: false,
  lastFetchAttemptStoreId: null,
  lastFetchAttemptAt: null,

  setStoreId: (store_id) => set({ store_id }),
  setPercentage: (percentage) => set({ percentage }),
  setBaseAmount: (base_amount) => set({ base_amount }),
  setEarningType: (earning_type) => set({ earning_type }),
  setFixedPoints: (fixed_points) => set({ fixed_points }),
  setMinimumSpend: (minimum_spend) => set({ minimum_spend }),
  setMaxPointsPerTxn: (max_points_per_txn) => set({ max_points_per_txn }),
  setActive: (active) => set({ active }),

  setConfig: (config) => set({ config }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setToggling: (toggling) => set({ toggling }),
  setDeleting: (deleting) => set({ deleting }),
  setModal: (modal) => set({ modal }),
  setErrors: (errors) => set({ errors }),
  setLastLoadedStoreId: (storeId) => set({ lastLoadedStoreId: storeId }),
  setHasLoadedOnceForStore: (hasLoadedOnce) => set({ hasLoadedOnceForStore: hasLoadedOnce }),
  setLastFetchAttemptStoreId: (storeId) => set({ lastFetchAttemptStoreId: storeId }),
  setLastFetchAttemptAt: (ts) => set({ lastFetchAttemptAt: ts }),

  reset: () =>
    set({
      store_id: "",
      percentage: 0,
      base_amount: 0,
      earning_type: "percentage",
      fixed_points: 0,
      minimum_spend: 0,
      max_points_per_txn: 0,
      active: false,
      config: null,
      loading: true,
      refreshing: false,
      toggling: false,
      deleting: false,
      modal: null,
      errors: {
        percentage: false,
        percentageErrorMessage: "",
        baseAmount: false,
        baseAmountErrorMessage: "", 
        fixedPoints: false,
        fixedPointsErrorMessage: "",
        minimumSpend: false,
        minimumSpendErrorMessage: "",
        maxPointsPerTxn: false,
        maxPointsPerTxnErrorMessage: "",
      },
      lastLoadedStoreId: null,
      hasLoadedOnceForStore: false,
      lastFetchAttemptStoreId: null,
      lastFetchAttemptAt: null,
    }),
}));