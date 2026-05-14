import { create } from "zustand";
import { TypeFilter, initialState } from "@/type/store-manager/transaction";

interface TransactionStore {
  selectedStoreId: number | null;
  typeFilter: TypeFilter;
  setSelectedStoreId: (id: number) => void;
  setTypeFilter: (typeFilter: TypeFilter) => void;
  reset: () => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  ...initialState,
  setSelectedStoreId: (id) => set({ selectedStoreId: id }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  reset: () => set(initialState),
}));
