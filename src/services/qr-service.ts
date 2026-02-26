
import { supabase } from "@/supabase/supabase";
import { QRCodeState } from "@/type/qr";

export async function generateQRCode(userId: string, expiryHours: number = 1):Promise<QRCodeState | null> {
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const { data, error, status } = await supabase
    .from('qr_codes')
    .insert([
      {
        user_id: userId,
        is_used: false,
        store_staff_id: null,
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
}