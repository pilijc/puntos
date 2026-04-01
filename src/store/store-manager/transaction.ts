import { create } from "zustand";
import { TransactionItem, TypeFilter, initialState } from "@/type/store-manager/transaction";

interface TransactionStore {
  selectedStoreId: number | null;
  typeFilter: TypeFilter;
  items: TransactionItem[];
  page: number;
  hasMore: boolean;
  loading: boolean; 
  loadingMore: boolean;
  refreshing: boolean;

  setSelectedStoreId: (id: number) => void;
  setTypeFilter: (typeFilter: TypeFilter) => void;
  replaceItems: (items: TransactionItem[], hasMore: boolean, nextPage: number) => void;
  appendItems: (items: TransactionItem[], hasMore: boolean, nextPage: number) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  ...initialState,
  setSelectedStoreId: (id) => set({ selectedStoreId: id }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  replaceItems: (items, hasMore, nextPage) =>
    set({ items, hasMore, page: nextPage }),
  appendItems: (newItems, hasMore, nextPage) =>
    set((state) => ({
      items: [...state.items, ...newItems],
      hasMore,
      page: nextPage,
    })),
  setLoading: (loading) => set({ loading }),
  setLoadingMore: (loadingMore) => set({ loadingMore }),
  setRefreshing: (refreshing) => set({ refreshing }),
  reset: () => set(initialState),
}));
