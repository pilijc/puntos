
import { supabase } from "@/supabase/supabase";
import { store } from "expo-router/build/global-state/router-store";
 

 
 
export interface QRCodeState {
  id: string;
  user_id: string | null;
  store_staff_id: string | null;
  is_used: boolean;
  scanned_at: string | null;
  transaction_completed_at: string | null;
  created_at: string;
  expires_at: string;
}

export async function generateQRCode(userId: string, expiryHours: number = 1) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const { data, error, status } = await supabase
    .from('qr_codes')
    .insert([
      {
        user_id: userId,
       
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
}