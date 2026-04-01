import { supabase } from "@/supabase/supabase";
import { Voucher } from "@/type/user/voucher";

export interface VoucherTransaction {
    id: string;
    voucher_id: string;
    user_id: string;
    store_staff_id: string;
    store_id: number;
    amount: number;
    points_earned: number;
    created_at: string;
}

const limit = 5; 

function generateCode(length: number = limit): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function generateVoucherCode(
  userId: string,
  durationMinutes: number = 5
) {
  const voucherCode = generateCode();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  try {
    //Check if user already has active voucher
    const { data: existingVoucher } = await supabase
      .from("vouchers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_used", false)
      .gte("expires_at", now)
      .maybeSingle();

    if (existingVoucher) {
      await supabase
      .from('vouchers')
      .update({ is_used: true})
      .eq("id", existingVoucher.id)
    }

    //Create voucher
    const { data: voucherData, error: voucherError } = await supabase
      .from("vouchers")
      .insert({
        code: voucherCode,
        expires_at: expiresAt,
        user_id: userId,
        is_used: false,
      })
      .select()
      .single();

    if (voucherError || !voucherData) {
      throw voucherError ?? new Error("Failed to generate voucher.");
    }

    return voucherData;

  } catch (error) {
    console.error("Error generating voucher:", error);
    throw error;
  }
}
 
// export async function getActiveVoucher(userId: string): Promise<Voucher | null> {
//   const { data, error } = await supabase
//     .from("vouchers")
//     .select("*")
//     .eq("user_id", userId)
//     .eq("is_used", false)
//     .gte("expires_at", new Date().toISOString())
//     .maybeSingle();

//   if (error) {
//     console.error("Error fetching active voucher:", error);
//     return null;
//   }

//   return data ?? null;
// }

//HISTORY SIDE
//Get user voucher transaction history with store names (limited to 5 latest)
export async function getUserVoucherTransactionHistory(userId: string): Promise<any[]> {
  try {
    // First, test basic access to the table
    console.log('Testing basic access to voucher_transactions...');
    const { data: testData, error: testError } = await supabase
      .from('voucher_transactions')
      .select('id, user_id')
      .eq('user_id', userId)
      .limit(1);

    if (testError) {
      console.error('Basic access test failed:', testError);
      console.error('Test error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      return [];
    }

    console.log('Basic access test passed, found records:', testData?.length || 0);

    // Fetch voucher transactions with store information (manual join)
    const { data: transactions, error } = await supabase
      .from('voucher_transactions')
      .select(`
        id,
        points_earned,
        amount,
        created_at,
        store_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voucher transaction history:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    // Get store names separately (manual join)
    const storeIds = [...new Set(transactions.map(t => t.store_id))];
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    if (storesError) {
      console.error('Error fetching store names:', storesError);
    }

    // Create store lookup map
    const storeMap = (stores || []).reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {});

    // Format the data for the UI (matching QR transaction format)
    return transactions.map((transaction: any) => ({
      id: transaction.id,
      section: formatDateSection(transaction.created_at),
      type: 'earned',
      title: storeMap[transaction.store_id] || 'user.activity.unknownStore',
      subtitle: 'user.activity.subtitle.voucherPoints',
      time: transaction.created_at,
      points: `+${transaction.points_earned}`,
      positive: true,
      icon: '🎫', // Add icon for voucher transactions
      transactionType: 'voucher', // Add identifier for voucher transactions
    }));
  } catch (error) {
    console.error('Exception fetching voucher transaction history:', error);
    return [];
  }
}

// Helper function to format date section (matching QR service)
function formatDateSection(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'user.activity.today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'user.activity.yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
}

export function listenToVoucherTransaction(userId: string, onProcessed: (transaction: VoucherTransaction) => void) {
    const channel = supabase.channel(`voucher_transactions-${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'voucher_transactions',
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            console.log("Voucher transaction realtime triggered:", payload);
            const newRow = payload.new as VoucherTransaction;
            onProcessed(newRow);
        })
        .subscribe((status) => {
            console.log(`Customer voucher listener status for user ${userId}:`, status);
            if (status === 'SUBSCRIBED') {
                //console.log(`Successfully subscribed to voucher transactions for user ${userId}`);
            } else if (status === 'TIMED_OUT') {
                //console.error(`Voucher listener subscription timed out for user ${userId}:`, status);
                // Retry connection after timeout
                setTimeout(() => {
                  //  console.log(`Retrying voucher listener connection for user ${userId}`);
                    channel.subscribe();
                }, 3000);
            } else if (status === 'CLOSED') {
                //console.log(`Voucher listener closed for user ${userId} - this is normal during cleanup`);
            } else {
                //console.warn(`Voucher listener unexpected status for user ${userId}:`, status);
            }
        });

    return channel;
}