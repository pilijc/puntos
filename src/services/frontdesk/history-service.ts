import { supabase } from "@/supabase/supabase";

export interface StaffTransaction {
  id: string;
  points: number;
  timestamp: Date;
  amount: number;
  type: "earned" | "redeemed" | "pending";
  method?: "qr" | "manual" | "voucher";
  customerName?: string;
  customer_id?: string;
  rewardTitle?: string;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export async function getStaffTransactions(
  staffId: string, 
  storeId: number, 
  pagination?: PaginationOptions
): Promise<{ transactions: StaffTransaction[]; hasMore: boolean }> {
  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;
  
   try {
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: allPurchases, error: allPurchasesError } = await supabase
      .from("purchases")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
      
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select(`
        id,
        amount,
        points_earned,
        created_at,
        user_id,
        fontdesk_session_id,
        metadata,
        users!user_id(
          name
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (purchasesError) {
      return { transactions: [], hasMore: false };
    }

    const { data: staffQRTransactions, error: qrError } = await supabase
      .from("qr_transactions")
      .select(`
        qr_code_id,
        points_earned,
        created_at,
        user_id,
        users!user_id(
          name
        )
      `)
      .eq("store_staff_id", staffId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
          
    if (qrError) {
      console.error("Error fetching staff QR transactions:", qrError);
    }
    
   
    const { data: staffSessions, error: sessionsError } = await supabase
      .from("frontdesk_sessions")
      .select("id")
      .eq("staff_id", staffId);
      
    const staffSessionIds = staffSessions?.map(s => s.id) || [];
    const filteredPurchases = purchases?.filter(p => p.fontdesk_session_id && staffSessionIds.includes(p.fontdesk_session_id)) || [];
    const voucherPurchases = purchases?.filter(p => 
        !p.fontdesk_session_id && 
        p.metadata && 
        p.metadata.transaction_type === "voucher" &&
        p.metadata.processed_by_staff === staffId
    ) || [];

    // Query reward redemptions for this staff
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select(`
        id,
        points_spent,
        created_at,
        reward_id,
        user_id,
        users!user_id(
          name
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (redemptionsError) {
      return { transactions: [], hasMore: false };
    }

    // Fetch reward data separately
    const rewardIds = [...new Set((redemptions || []).map(r => r.reward_id).filter(id => id != null))];
    const { data: rewards, error: rewardsError } = await supabase
      .from("store_rewards")
      .select("id, title")
      .in("id", rewardIds);

    // Create reward lookup map
    const rewardMap = (rewards || []).reduce((acc, reward) => {
      acc[reward.id] = reward;
      return acc;
    }, {});
    
    // Format traditional purchases as earned transactions
    const formattedPurchases: StaffTransaction[] = (filteredPurchases || []).map((p: any) => ({
      id: p.id,
      points: Number(p.points_earned),
      timestamp: new Date(p.created_at),
      amount: Number(p.amount),
      type: "earned" as const,
      method: "qr" as const,
      customerName: p.users ? p.users.name || "Customer" : "Customer",
      customer_id: p.user_id,
    }));

    // Format voucher purchases as earned transactions
    const formattedVoucherPurchases: StaffTransaction[] = (voucherPurchases || []).map((p: any) => ({
      id: `voucher-${p.id}`,
      points: Number(p.points_earned),
      timestamp: new Date(p.created_at),
      amount: Number(p.amount),
      type: "earned" as const,
      method: "voucher" as const,
      customerName: p.users ? p.users.name || "Customer" : "Customer",
      customer_id: p.user_id,
    }));

    // Format QR transactions as earned transactions
    const formattedQRTransactions: StaffTransaction[] = (staffQRTransactions || []).map((qr: any, index: number) => ({
      id: qr.qr_code_id ? `qr-${qr.qr_code_id}` : `qr-${qr.user_id}-${qr.created_at}-${index}`,
      points: Number(qr.points_earned),
      timestamp: new Date(qr.created_at),
      amount: Number(qr.points_earned) * 10, 
      type: "earned" as const,
      method: "qr" as const,
      customerName: qr.users ? qr.users.name || "Customer" : "Customer",
      customer_id: qr.user_id,
    }));

    // Format redemptions as redeemed transactions
    const formattedRedemptions: StaffTransaction[] = (redemptions || []).map((r: any) => {
      const reward = rewardMap[r.reward_id];
      return {
        id: `redemption-${r.id}`,
        points: Number(r.points_spent),
        timestamp: new Date(r.created_at),
        amount: 0,  
        type: "redeemed" as const,
        method: "voucher" as const,
        customerName: r.users ? r.users.name || "Customer" : "Customer",
        customer_id: r.user_id,
        rewardTitle: reward?.title || "Reward",
      };
    });

    // Combine and sort by timestamp
    const allTransactions = [...formattedPurchases, ...formattedVoucherPurchases, ...formattedQRTransactions, ...formattedRedemptions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    // Apply pagination - slice the array based on offset and limit
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);
    const hasMore = allTransactions.length > offset + limit;
    
    return { transactions: paginatedTransactions, hasMore };
  } catch (error) {
    return { transactions: [], hasMore: false };
  }
}
