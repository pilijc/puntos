import { supabase } from "@/supabase/supabase";

export interface ScanResult {
  success: boolean;
  message: string;
  pointsEarned?: number;
}

export async function scanQRCode(
  qrId: string,
  operatorId: string,
  storeId: string,
  pointsEarned: number
): Promise<ScanResult> {
  // 1. Fetch QR code
  const { data: qrData, error: fetchError } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qrId)
    .single();

  if (fetchError || !qrData) {
    return { success: false, message: "QR code not found" };
  }

  // VALIDATION: Checked the qr if already used or expired
  const now = new Date();
  if (qrData.is_used) {
    return { success: false, message: "QR code has already been used" };
  }
  if (new Date(qrData.expires_at) < now) {
    return { success: false, message: "QR code has expired" };
  }

  // 3. Update qr_codes as used
  const { error: updateError } = await supabase
    .from("qr_codes")
    .update({
      is_used: true,
      scanned_at: now.toISOString(),
      store_staff_id: operatorId,
      transaction_completed_at: now.toISOString(),
    })
    .eq("id", qrId);

  if (updateError) {
    return { success: false, message: "Failed to update QR code" };
  }

  // 4. Insert into qr_transactions
  const { error: insertError } = await supabase
    .from("qr_transactions")
    .insert([
      {
        qr_code_id: qrId,
        user_id: qrData.user_id,
        store_id: storeId,
        points_earned: pointsEarned,
        created_at: now.toISOString(),
      },
    ]);

  if (insertError) {
    return { success: false, message: "Failed to log transaction" };
  }

  return { success: true, message: "QR scanned successfully", pointsEarned };
}