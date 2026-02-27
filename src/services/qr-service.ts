

import { supabase } from "@/supabase/supabase";
import { QRCodeState, QRTransaction } from "@/type/qr";
import { store } from "expo-router/build/global-state/router-store";



export async function getCurrentUser() {

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;

  return user; 

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

  return data[0]; // return the inserted QR row
} */

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

// Create QR transaction
export async function createQRTransaction(
  userId: string,
  storeStaffId: string,
  pointsAwarded: number = 0
): Promise<QRTransaction> {
  const { data, error } = await supabase
    .from('qr-transactions')
    .insert([
      {
        user_id: userId,
        store_staff_id: storeStaffId,
       // store_id: null, // Add store_id if available
        scanned_at: new Date().toISOString(),
        points_awarded: pointsAwarded,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create QR transaction: ${error.message}`);
  }

  return data as QRTransaction;
}