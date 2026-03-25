

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
  console.log(`QR Service: Looking up points configuration for store_id: ${storeId}`);
  console.log('QR Service: Store ID type:', typeof storeId, 'value:', storeId);
  
  // Debug: Check what's in store_qr_rewards table
  const { data: allStoreRewards, error: allRewardsError } = await supabase
    .from('store_qr')
    .select('*')
    .limit(10);
  console.log('QR Service: All store_qr_rewards data:', allStoreRewards);
  console.log('QR Service: All store_qr_rewards error:', allRewardsError);
  
  const { data: pointsData, error: pointsError } = await supabase
    .from('store_qr')
    .select('percentage')
    .eq('store_id', storeId)
    .single();

  console.log('QR Service: Raw database response:');
  console.log('- pointsData:', JSON.stringify(pointsData, null, 2));
  console.log('- pointsError:', JSON.stringify(pointsError, null, 2));
  console.log('- pointsData?.percentage:', pointsData?.percentage);
  console.log('- typeof pointsData?.percentage:', typeof pointsData?.percentage);

  // default 10% if no configuration is found
  const percentage = pointsData?.percentage || 10;
  
  if (pointsError) {
    console.warn(`QR Service: No points configuration found for store ${storeId}, using default 10%. Error:`, pointsError);
  } else {
    console.log(`QR Service: Using percentage ${percentage}% for store ${storeId}`);
  }

  //Calculate points for purchase amount and percentage
  const pointsToAward = Math.ceil(purchaseAmount * (percentage / 100));
  console.log(`QR Service: Calculated points: ${pointsToAward} (amount: ${purchaseAmount}, percentage: ${percentage}%)`);

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
      filter: `user_id=eq.${userId}`   
    }, (payload) => {
      console.log("Realtime triggered:", payload);
      const newRow = payload.new as QRTransaction;
      onScanned(newRow);
    })
    .subscribe((status) => {
      console.log(`Customer QR listener status for user ${userId}:`, status);
      if (status === 'SUBSCRIBED') {
        //console.log(`Successfully subscribed to QR transactions for user ${userId}`);
      } else if (status === 'TIMED_OUT') {
        //console.error(`QR listener subscription timed out for user ${userId}:`, status);
        // Retry connection after timeout
        setTimeout(() => {
          //console.log(`Retrying QR listener connection for user ${userId}`);
          channel.subscribe();
        }, 3000);
      } else if (status === 'CLOSED') {
        //console.log(`QR listener closed for user ${userId} - this is normal during cleanup`);
      } else {
        //console.warn(`QR listener unexpected status for user ${userId}:`, status);
      }
    });

  return channel;
}

//HISTORY SIDE
//Get user transaction history with store names
export async function getUserTransactionHistory(userId: string): Promise<any[]> {
  try {
    // Fetch transactions with store information (manual join)
    const { data: transactions, error } = await supabase
      .from('qr_transactions')
      .select(`
        id,
        points_earned,
        created_at,
        store_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    // Get store names separately (manual join)
    const storeIds = [...new Set(transactions.map(t => t.store_id).filter(id => id != null))];
    
    if (storeIds.length === 0) {
      console.log('No store IDs found in transactions');
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
      console.error('Error fetching store names:', storesError);
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

 