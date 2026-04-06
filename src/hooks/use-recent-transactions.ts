import { create } from "zustand";
import { supabase } from "@/supabase/supabase";

export interface RecentScan {
  points: number;
  timestamp: Date;
  amount: number;
}

interface RecentTransactionsState {
  recentScans: RecentScan[];
  isLoading: boolean;
  hasFetchedOnce: boolean;
  fetchTransactions: (storeId: number) => Promise<void>;
  addScan: (scan: RecentScan) => void;
  clearTransactions: () => void;
}

export const useRecentTransactions = create<RecentTransactionsState>((set, get) => ({
  recentScans: [],
  isLoading: false,
  hasFetchedOnce: false,

  fetchTransactions: async (storeId: number) => {
    // Prevent UI flashes if already fetched locally
    set({ isLoading: !get().hasFetchedOnce });

    try {
      // Get start of today in local timezone
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("amount, points_earned, created_at")
        .eq("store_id", storeId)
        .gte("created_at", startOfToday.toISOString())
        .order("created_at", { ascending: false })
        .limit(5); // Limit to 5 most recent transactions

      if (error) {
        console.error("Error fetching recent transactions:", error);
        set({ recentScans: [], isLoading: false, hasFetchedOnce: true });
        return;
      }

      const formattedScans: RecentScan[] = (purchases || []).map((p) => ({
        amount: Number(p.amount),
        points: Number(p.points_earned),
        timestamp: new Date(p.created_at),
      }));

      set({ recentScans: formattedScans, isLoading: false, hasFetchedOnce: true });
    } catch (e) {
      console.error("Exception fetching recent transactions:", e);
      set({ recentScans: [], isLoading: false, hasFetchedOnce: true });
    }
  },

  addScan: (scan: RecentScan) => {
    set((state) => {
      const updatedScans = [scan, ...state.recentScans];
      // Keep only the latest 5 transactions
      return { recentScans: updatedScans.slice(0, 5) };
    });
  },

  clearTransactions: () => {
    set({ recentScans: [], hasFetchedOnce: false, isLoading: false });
  },
}));
