import { supabase } from "@/supabase/supabase";

import { QRCodeState, QRTransaction } from "@/type/qr";
import {listenToVoucherTransaction } from "@/services/user/voucher-service";
import { issueStampForPurchase } from "@/services/stamp-service";
import { VoucherTransaction } from "@/type/user/voucher";
import {FinalCalculations} from "@/services/frontdesk/percentage-service";
import { canUserEarnPurchasePoints } from "@/services/points/earning-gate";

export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw sessionError;
    }
    
    if (!session) {
      throw new Error('Auth session missing!');
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return user; 
  } catch (error) {
    throw error;
  }
}

//Add auto user into qr_codes table
export async function addAutoUser(){
  
  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();
  
  if(userError || !user) {
    throw new Error('User not found');   
  }

  const {data, error} = await supabase
    .from('qr_codes')
    .insert([{
      user_id: user.id,
      created_at: new Date().toISOString(),
    },
  ])
    .select('*');

  if(error) {
    throw new Error('User not found');   
  }

  return data[0];

}




// New Static QR Code Functions
export function getStaticQRCode(userId: string): string {

  return `puntos:user:${userId}`;
}


// Parse static QR code
export function parseQRCode(qrValue: string): { type: string; userId: string } | null {
  const parts = qrValue.split(':');
  if (parts.length === 3 && parts[0] === 'puntos' && parts[1] === 'user') {
    return { type: 'user', userId: parts[2] };
  }
  return null;
}

// Create QR transaction with purchase tracking and dynamic points calculation --> THIS METHOD WILL CALL TO OPERATOR-SERVICE
export async function createQRTransaction(
  userId: string,
  storeStaffId: string,
  purchaseAmount: number
): Promise<QRTransaction> {
  // get the store_id from store_staff
  const { data: staffData, error: staffError } = await supabase
    .from('store_staff')
    .select('store_id')
    .eq('user_id', storeStaffId)
    .eq('is_active', true)
    .single();

  if (staffError || !staffData) {
    throw new Error('Failed to get store information for staff member');
  }

    const storeId = staffData.store_id;
    const pointResult = await FinalCalculations(storeId, purchaseAmount);
    const eligible = await canUserEarnPurchasePoints({ userId, storeId });
    const pointsEarned = eligible ? pointResult.points : 0;

  //Create purchase record first
  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .insert([
      {
        user_id: userId,
        store_id: storeId,
        amount: purchaseAmount,
        created_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (purchaseError) {
    throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
  }

  // Update purchase record with points earned
  const { error: updatePurchaseError } = await supabase
    .from('purchases')
    .update({
      points_earned: pointsEarned,
    })
    .eq('id', purchaseData.id);

  if (updatePurchaseError) {
   }

  // Decrease the stored_amount in points table

  // Award a stamp for the verified purchase via server-authoritative RPC.
  // The RPC uses DB now() for timestamps and enforces purchase_id uniqueness
  // so the same QR scan can never mint more than one stamp.
  await issueStampForPurchase(purchaseData.id);

  // Create the QR transaction
  const { data, error } = await supabase
    .from('qr_transactions')
    .insert([
      {
        user_id: userId,
        store_staff_id: storeStaffId,
        points_earned: pointsEarned,
        store_id: storeId,
        created_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create QR transaction: ${error.message}`);
  }

  return data as QRTransaction;
}

export function listenToQRTransaction(userId: string, onScanned: (transaction: QRTransaction) => void) {
  const channel = supabase.channel(`qr_transactions-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',  
      schema: 'public',
      table: 'qr_transactions',
      filter: `user_id=eq.${userId}`   
    }, (payload) => {
       const newRow = payload.new as QRTransaction;
      onScanned(newRow);
    })
    .subscribe((status) => {
       if (status === 'SUBSCRIBED') {
      } else if (status === 'TIMED_OUT') {
        // Retry connection after timeout
        setTimeout(() => {
          channel.subscribe();
        }, 3000);
      } else if (status === 'CLOSED') {
       } else {
       }
    });

  return channel;
}

export function setupQRListeners(userId: string, onQRTransaction: (transaction: QRTransaction) => void, onVoucherTransaction: (transaction: VoucherTransaction) => void) {
  // Listen to QR transactions
  const qrChannel = listenToQRTransaction(userId, (transaction) => {
     onQRTransaction(transaction);
  });
  
  // Listen to voucher transactions
  const voucherChannel = listenToVoucherTransaction(userId, (transaction) => {
     onVoucherTransaction(transaction);
  });

  return { qrChannel, voucherChannel };
}

export async function initQrScreen(): Promise<{ userId: string; qrValue: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Auth session missing!');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Auth session missing!');

    try { 
      await addAutoUser(); 
    } catch (_) {}

    return { userId: user.id, qrValue: getStaticQRCode(user.id) };
  } catch (error) {
    throw error;
  }
}

export function cleanupQRChannels(channels: { qrChannel: any; voucherChannel: any } | null) {
  if (channels?.qrChannel) {
    supabase.removeChannel(channels.qrChannel);
   }
  if (channels?.voucherChannel) {
    supabase.removeChannel(channels.voucherChannel);
   }
}

//HISTORY SIDE
//Get user transaction history with store names
export async function getUserTransactionHistory(userId: string, storeId?: string, limit?: number): Promise<any[]> {
  try {
    // Fetch transactions with store information (manual join)
    let query = supabase
      .from('qr_transactions')
      .select(`
        id,
        points_earned,
        created_at,
        store_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: transactions, error } = await query;

    if (error) {
       return [];
    }

    // Get store names separately (manual join)
    const storeIds = [...new Set(transactions.map(t => t.store_id).filter(id => id != null))];
    
    if (storeIds.length === 0) {
       // Return transactions with unknown store names
      return transactions.map((transaction: any) => ({
        id: transaction.id,
        section: formatDateSection(transaction.created_at),
        type: 'earned',
        title: 'user.activity.unknownStore',
        subtitle: 'user.activity.subtitle.purchasePoints',
        time: transaction.created_at,
        points: `+${transaction.points_earned}`,
        positive: true,
        icon: '🛒',
        transactionType: 'qr',
      }));
    }

    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    if (storesError) {
     }

    // Create store lookup map
    const storeMap = (stores || []).reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {});

    // Format the data for the UI
    return transactions.map((transaction: any) => ({
      id: transaction.id,
      section: formatDateSection(transaction.created_at),
      type: 'earned',
      title: storeMap[transaction.store_id] || 'user.activity.unknownStore',
      subtitle: 'user.activity.subtitle.purchasePoints',
      time: transaction.created_at,
      points: `+${transaction.points_earned}`,
      positive: true,
      icon: '🛒', // Add icon for QR transactions
      transactionType: 'qr', // Add identifier for QR transactions
      storeId: transaction.store_id, // Add storeId for navigation
    }));
  } catch (error) {
     return [];
  }
}




// Helper function to format date sections
function formatDateSection(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (transactionDate.getTime() === today.getTime()) {
    return 'today';
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else {
    return dateString;
  }
}

// Helper function to format time
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

 