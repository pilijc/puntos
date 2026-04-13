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
}

export async function getStaffTransactions(staffId: string, storeId: number): Promise<StaffTransaction[]> {
  console.log("Fetching staff transactions for staffId:", staffId, "storeId:", storeId);
  try {
    // Get start of today in local timezone
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // First, let's try a simpler query to get all purchases for this store
    const { data: allPurchases, error: allPurchasesError } = await supabase
      .from("purchases")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
      
    console.log("All purchases for store:", allPurchases);
    
    // Now let's try to get purchases with frontdesk session join
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
      console.error("Error fetching staff purchases:", purchasesError);
      return [];
    }
    
    console.log("Purchases data:", purchases);

    // Get QR transactions for this staff member (this is likely where the staff info is stored)
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
      
    console.log("Staff QR transactions:", staffQRTransactions);
    
    if (qrError) {
      console.error("Error fetching staff QR transactions:", qrError);
    }
    
    // Also check if there are any purchases with valid frontdesk sessions
    const { data: staffSessions, error: sessionsError } = await supabase
      .from("frontdesk_sessions")
      .select("id")
      .eq("staff_id", staffId);
      
    console.log("Staff sessions:", staffSessions);
    
    // Filter purchases by staff sessions (for traditional front desk transactions)
    const staffSessionIds = staffSessions?.map(s => s.id) || [];
    const filteredPurchases = purchases?.filter(p => p.fontdesk_session_id && staffSessionIds.includes(p.fontdesk_session_id)) || [];
    console.log("Filtered purchases for staff:", filteredPurchases);

    // Also get purchases without frontdesk sessions that have staff tracking in metadata
    const voucherPurchases = purchases?.filter(p => 
        !p.fontdesk_session_id && 
        p.metadata && 
        p.metadata.transaction_type === "voucher" &&
        p.metadata.processed_by_staff === staffId
    ) || [];
    console.log("Voucher purchases for staff:", voucherPurchases);

    // Query reward redemptions for this staff
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select(`
        id,
        points_spent,
        created_at,
        user_id,
        users!user_id(
          name
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (redemptionsError) {
      console.error("Error fetching staff redemptions:", redemptionsError);
      return [];
    }
    
    console.log("Redemptions data:", redemptions);

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
      amount: Number(qr.points_earned) * 10, // Assuming 1 point = 10 pesos, adjust as needed
      type: "earned" as const,
      method: "qr" as const,
      customerName: qr.users ? qr.users.name || "Customer" : "Customer",
      customer_id: qr.user_id,
    }));

    // Format redemptions as redeemed transactions
    const formattedRedemptions: StaffTransaction[] = (redemptions || []).map((r: any) => ({
      id: `redemption-${r.id}`,
      points: Number(r.points_spent),
      timestamp: new Date(r.created_at),
      amount: 0, // Redemptions don't have purchase amounts
      type: "redeemed" as const,
      method: "manual" as const,
      customerName: r.users ? r.users.name || "Customer" : "Customer",
      customer_id: r.user_id,
    }));

    // Combine and sort by timestamp
    const allTransactions = [...formattedPurchases, ...formattedVoucherPurchases, ...formattedQRTransactions, ...formattedRedemptions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    console.log("Final formatted transactions:", allTransactions);
    return allTransactions;
  } catch (error) {
    console.error("Exception fetching staff transactions:", error);
    return [];
  }
}
