

import { supabase } from "@/supabase/supabase";

import { QRCodeState, QRTransaction } from "@/type/qr";


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

// Create QR transaction with dynamic points calculation
export async function createQRTransaction(
  userId: string,
  storeStaffId: string,
  purchaseAmount: number
): Promise<QRTransaction> {
  // First, get the store_id from store_staff
  const { data: staffData, error: staffError } = await supabase
    .from('store_staff')
    .select('store_id')
    .eq('id', storeStaffId)
    .single();

  if (staffError || !staffData) {
    throw new Error('Failed to get store information for staff member');
  }

  const storeId = staffData.store_id;

  // Get points configuration for this store
  const { data: pointsData, error: pointsError } = await supabase
    .from('points')
    .select('stored_amount, percentage')
    .eq('store_id', storeId)
    .single();

  if (pointsError || !pointsData) {
    throw new Error('Failed to get points configuration for store');
  }

  // Calculate points to award based on purchase amount and percentage
  const pointsToAward = Math.floor(purchaseAmount * (pointsData.percentage / 100));

  // Check if store has enough points
  if (pointsData.stored_amount < pointsToAward) {
    throw new Error(`Insufficient points balance. Store has ${pointsData.stored_amount} points available, but ${pointsToAward} points needed.`);
  }

  // Create the transaction
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

  // Decrease the stored_amount in points table
  const { error: updateError } = await supabase
    .from('points')
    .update({
      stored_amount: pointsData.stored_amount - pointsToAward,
      updated_at: new Date().toISOString()
    })
    .eq('store_id', storeId);

  if (updateError) {
    console.error('Failed to update points balance:', updateError);
    // Transaction was created but points balance update failed
    // In a production system, you'd want to handle this with a rollback or compensation
  }

  return data as QRTransaction;
}

export function listenToQRTransaction(userId: string, onScanned: (transaction: QRTransaction) => void) {
  const channel = supabase.channel(`qr_transactions-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',  
      schema: 'public',
      table: 'qr_transactions',
      // filter: `user_id=eq.${userId}`  // Temporarily removed for testing
    }, (payload) => {
      console.log("Realtime triggered:", payload);
      const newRow = payload.new as QRTransaction;
      // Only process if it's for this user
      if (newRow.user_id === userId) {
        onScanned(newRow);
      }
    })
    .subscribe((status) => {
      console.log(`Customer QR listener status for user ${userId}:`, status);
    });

  return channel;
}

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
      title: transaction.stores?.name || 'Unknown Store',
      subtitle: 'Purchase Points',
      time: formatTime(transaction.created_at),
      points: `+${transaction.points_earned}`,
      positive: true,
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
    return 'Today';
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
}

// Helper function to format time
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}



/*
export async function generateQRCode(userId: string, expiryHours: number = 1) {
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const { data, error, status } = await supabase
    .from('qr_codes')
    .insert([
      {
        user_id: userId,
        barcode_hash: null,
        store_staff_id: null,
        is_used: false,
         scanned_at: null,
        transaction_completed_at: null,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
    ])
    .select('*');  

  console.log('Supabase insert result:', { data, error, status });

  if (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      'No QR code returned from Supabase. Check table name, columns, and RLS policies.'
    );
  }

  return data[0]; 
} */

