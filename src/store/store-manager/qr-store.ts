import { QRPurchaseStore } from "@/type/store-manager/qr.purchase";
import { create } from "zustand";
import type { ModalButton } from "@/components/modal";
import { getQRConfig } from "@/services/store-manager/qr-service";

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
  setConfig: (config: QRConfig | null) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setToggling: (toggling: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setModal: (modal: QRModalState) => void;
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
    }),
}));