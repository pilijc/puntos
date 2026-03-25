export type EarningType = "fixed" | "percentage";

export interface QRPurchase {
  id?: string;
  store_id: string;
  percentage: number;
  base_amount: number;
  earning_type: EarningType;
  fixed_points: number;
  minimum_spend: number;
  max_points_per_txn: number;
  active?: boolean;
  created_at?: string;
}

export interface QRPurchaseStore {
  store_id: string;
  percentage: number;
  base_amount: number;
  earning_type: EarningType;
  fixed_points: number;
  minimum_spend: number;
  max_points_per_txn: number;
  active: boolean;

  setStoreId: (store_id: string) => void;
  setPercentage: (percentage: number) => void;
  setBaseAmount: (base_amount: number) => void;
  setEarningType: (earning_type: EarningType) => void;
  setFixedPoints: (fixed_points: number) => void;
  setMinimumSpend: (minimum_spend: number) => void;
  setMaxPointsPerTxn: (max_points_per_txn: number) => void;
  setActive: (active: boolean) => void;
  reset: () => void;
}