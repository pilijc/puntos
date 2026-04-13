import { create } from "zustand";
import { StaffTransaction, getStaffTransactions, PaginationOptions } from "@/services/frontdesk/history-service";

interface StaffHistoryState {
  staffTransactions: StaffTransaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasFetchedOnce: boolean;
  hasMore: boolean;
  currentOffset: number;
  fetchStaffTransactions: (staffId: string, storeId: number, reset?: boolean) => Promise<void>;
  loadMoreTransactions: (staffId: string, storeId: number) => Promise<void>;
  clearStaffTransactions: () => void;
}

const PAGE_SIZE = 20;

export const useStaffHistory = create<StaffHistoryState>((set, get) => ({
  staffTransactions: [],
  isLoading: false,
  isLoadingMore: false,
  hasFetchedOnce: false,
  hasMore: true,
  currentOffset: 0,

  fetchStaffTransactions: async (staffId: string, storeId: number, reset: boolean = true) => {
    console.log("Hook: fetchStaffTransactions called with staffId:", staffId, "storeId:", storeId, "reset:", reset);
    
    const isFirstLoad = !get().hasFetchedOnce;
    const offset = reset ? 0 : get().currentOffset;
    
    if (isFirstLoad || reset) {
      set({ isLoading: true });
    }
    
    try {
      const pagination: PaginationOptions = { limit: PAGE_SIZE, offset };
      const result = await getStaffTransactions(staffId, storeId, pagination);
      
      console.log("Hook: Received transactions:", result.transactions.length, "hasMore:", result.hasMore);
      
      set({ 
        staffTransactions: reset ? result.transactions : [...get().staffTransactions, ...result.transactions], 
        isLoading: false,
        isLoadingMore: false,
        hasFetchedOnce: true,
        hasMore: result.hasMore,
        currentOffset: offset + result.transactions.length
      });
    } catch (error) {
      console.error("Exception fetching staff history:", error);
      set({ 
        staffTransactions: reset ? [] : get().staffTransactions, 
        isLoading: false, 
        isLoadingMore: false,
        hasFetchedOnce: true,
        hasMore: false
      });
    }
  },

  loadMoreTransactions: async (staffId: string, storeId: number) => {
    const { hasMore, isLoadingMore, currentOffset } = get();
    
    if (!hasMore || isLoadingMore) return;
    
    console.log("Hook: Loading more transactions from offset:", currentOffset);
    set({ isLoadingMore: true });
    
    try {
      const pagination: PaginationOptions = { limit: PAGE_SIZE, offset: currentOffset };
      const result = await getStaffTransactions(staffId, storeId, pagination);
      
      set({ 
        staffTransactions: [...get().staffTransactions, ...result.transactions], 
        isLoadingMore: false,
        hasMore: result.hasMore,
        currentOffset: currentOffset + result.transactions.length
      });
    } catch (error) {
      console.error("Exception loading more transactions:", error);
      set({ isLoadingMore: false });
    }
  },

  clearStaffTransactions: () => {
    set({ 
      staffTransactions: [], 
      hasFetchedOnce: false, 
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      currentOffset: 0
    });
  },
}));
