import { create } from "zustand";
import { supabase } from "@/supabase/supabase";

export interface RecentScan {
  points: number;
  timestamp: Date;
  amount: number;
  type?: "earned" | "redeemed";
  method?: "qr" | "voucher";
  customerName?: string;
  id?: string;
  rewardTitle?: string;
  pointsCost?: number;
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
     set({ isLoading: !get().hasFetchedOnce, recentScans: [] }); // Clear existing data

    try {
       const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

       const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, amount, points_earned, created_at, metadata, fontdesk_session_id")
        .eq("store_id", storeId)
        .gte("created_at", startOfToday.toISOString())
        .order("created_at", { ascending: false });

       const { data: redemptions, error: redemptionError } = await supabase
        .from("reward_redemptions")
        .select(`
          id,
          points_spent,
          created_at,
          reward_id,
          users!user_id(name)
        `)
        .eq("store_id", storeId)
        .gte("created_at", startOfToday.toISOString())
        .order("created_at", { ascending: false });

      // Fetch reward data separately
      const rewardIds = [...new Set((redemptions || []).map(r => r.reward_id).filter(id => id != null))];
      const { data: rewards, error: rewardsError } = await supabase
        .from("store_rewards")
        .select("id, title, points_cost")
        .in("id", rewardIds);

      // Create reward lookup map
      const rewardMap = (rewards || []).reduce((acc, reward) => {
        acc[reward.id] = reward;
        return acc;
      }, {});

       const formattedPurchases: RecentScan[] = (purchases || []).map((p: any) => {
        const isVoucher = p.metadata && p.metadata.transaction_type === "voucher";
        return {
          id: p.id,
          amount: Number(p.amount),
          points: Number(p.points_earned),
          timestamp: new Date(p.created_at),
          type: "earned",
          method: isVoucher ? "voucher" : "qr",
        };
      });

       const formattedRedemptions: RecentScan[] = (redemptions || []).map((r: any) => {
        const reward = rewardMap[r.reward_id];
        return {
          id: r.id,
          amount: reward?.points_cost || 0,
          points: Number(r.points_spent),
          timestamp: new Date(r.created_at),
          type: "redeemed",
          method: "voucher",
          customerName: r.users?.name || "Customer",
          rewardTitle: reward?.title || "Reward",
          pointsCost: reward?.points_cost || 0,
        };
      });

 
      const allTransactions = [...formattedPurchases, ...formattedRedemptions].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

       set({ recentScans: allTransactions.slice(0, 5), isLoading: false, hasFetchedOnce: true });
    } catch (e) {
      set({ recentScans: [], isLoading: false, hasFetchedOnce: true });
    }
  },

  addScan: (scan: RecentScan) => {
    set((state) => {
      const updatedScans = [scan, ...state.recentScans];
       return { recentScans: updatedScans.slice(0, 200) };
    });
  },

  clearTransactions: () => {
    set({ recentScans: [], hasFetchedOnce: false, isLoading: false });
  },
}));
