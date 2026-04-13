import { create } from "zustand";
import { StaffTransaction, getStaffTransactions } from "@/services/frontdesk/history-service";

interface StaffHistoryState {
  staffTransactions: StaffTransaction[];
  isLoading: boolean;
  hasFetchedOnce: boolean;
  fetchStaffTransactions: (staffId: string, storeId: number) => Promise<void>;
  clearStaffTransactions: () => void;
}

export const useStaffHistory = create<StaffHistoryState>((set, get) => ({
  staffTransactions: [],
  isLoading: false,
  hasFetchedOnce: false,

  fetchStaffTransactions: async (staffId: string, storeId: number) => {
    console.log("Hook: fetchStaffTransactions called with staffId:", staffId, "storeId:", storeId);
    // Prevent UI flashes if already fetched locally
    set({ isLoading: !get().hasFetchedOnce });

    try {
      const transactions = await getStaffTransactions(staffId, storeId);
      console.log("Hook: Received transactions:", transactions);
      
      set({ 
        staffTransactions: transactions, 
        isLoading: false, 
        hasFetchedOnce: true 
      });
    } catch (error) {
      console.error("Exception fetching staff history:", error);
      set({ staffTransactions: [], isLoading: false, hasFetchedOnce: true });
    }
  },

  clearStaffTransactions: () => {
    set({ staffTransactions: [], hasFetchedOnce: false, isLoading: false });
  },
}));
