import { QRPurchaseStore } from "@/type/store-manager/qr.purchase";
import { create } from "zustand";

export const useQRStore = create<QRPurchaseStore>((set) => ({
  store_id: "",
  percentage: 0,
  base_amount: 0,
  earning_type: "percentage",
  fixed_points: 0,  
  minimum_spend: 0,
  max_points_per_txn: 0,
  active: false,

  setStoreId: (store_id) => set({ store_id }),
  setPercentage: (percentage) => set({ percentage }),
  setBaseAmount: (base_amount) => set({ base_amount }),
  setEarningType: (earning_type) => set({ earning_type }),
  setFixedPoints: (fixed_points) => set({ fixed_points }),
  setMinimumSpend: (minimum_spend) => set({ minimum_spend }),
  setMaxPointsPerTxn: (max_points_per_txn) => set({ max_points_per_txn }),
  setActive: (active) => set({ active }),
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