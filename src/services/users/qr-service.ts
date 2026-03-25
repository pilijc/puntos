

import { supabase } from "@/supabase/supabase";

import { QRCodeState, QRTransaction } from "@/type/qr";
import { addStamp } from "@/services/stamp-service";


//import { store } from "expo-router/build/global-state/router-store";



export async function getCurrentUser() {

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;

  return user; 

}

//Add auto user to qr_codes table
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

  // Get points configuration for this store
  const { data: pointsData, error: pointsError } = await supabase
    .from('store_qr_rewards')
    .select('percentage')
    .eq('store_id', storeId)
    .single();

  // default 10% if no configuration is found
  const percentage = pointsData?.percentage || 10;
  
  if (pointsError) {
    console.warn(`No points configuration found for store ${storeId}, using default 10%`);
  }

  //Calculate points for purchase amount and percentage
  const pointsToAward = Math.ceil(purchaseAmount * (percentage / 100));

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
      points_earned: pointsToAward,
    })
    .eq('id', purchaseData.id);

  if (updatePurchaseError) {
    console.error('Failed to update purchase record with points earned:', updatePurchaseError);
  }

  // Decrease the stored_amount in points table
   

  // Award a stamp if the store has the program enabled (do this BEFORE QR transaction so real-time listeners fetching stamps get the latest data)
  await addStamp(userId, storeId);

  // Create the QR transaction
  const { data, error } = await supabase
    .from('qr_transactions')
    .insert([
      {
        user_id: userId,
        store_staff_id: storeStaffId,
        points_earned: pointsToAward,
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
      // filter: `user_id=eq.${userId}`   
    }, (payload) => {
      console.log("Realtime triggered:", payload);
      const newRow = payload.new as QRTransaction;
       
      if (newRow.user_id === userId) {
        onScanned(newRow);
      }
    })
    .subscribe((status) => {
      console.log(`Customer QR listener status for user ${userId}:`, status);
    });

  return channel;
}

//HISTORY SIDE
//Get user transaction history with store names
export async function getUserTransactionHistory(userId: string): Promise<any[]> {
  try {
    // Fetch transactions with store information
    const { data: transactions, error } = await supabase
      .from('qr_transactions')
      .select(`
        id,
        points_earned,
        created_at,
        store_id,
        stores (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    // Format the data for the UI
    return transactions.map((transaction: any) => ({
      id: transaction.id,
      section: formatDateSection(transaction.created_at),
      type: 'earned',
      title: transaction.stores?.name || 'user.activity.unknownStore',
      subtitle: 'user.activity.subtitle.purchasePoints',
      time: transaction.created_at,
      points: `+${transaction.points_earned}`,
      positive: true,
      transactionType: 'qr', // Add identifier for QR transactions
    }));
  } catch (error) {
    console.error('Error in getUserTransactionHistory:', error);
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

 