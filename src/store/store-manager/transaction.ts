import { create } from "zustand";
import { TransactionItem } from "@/type/store-manager/transaction";

interface TransactionStoreState {
  selectedStoreId: number | null;
  qrData: TransactionItem[];
  stampData: TransactionItem[];
  streakData: TransactionItem[];
  loading: boolean;
  refreshing: boolean;

  setSelectedStoreId: (id: number) => void;
  setData: (qr: TransactionItem[], stamp: TransactionItem[], streak: TransactionItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedStoreId: null,
  qrData: [],
  stampData: [],
  streakData: [],
  loading: false,
  refreshing: false,
};

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  ...initialState,
  setSelectedStoreId: (id) => set({ selectedStoreId: id }),
  setData: (qrData, stampData, streakData) => set({ qrData, stampData, streakData }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  reset: () => set(initialState),
}));
