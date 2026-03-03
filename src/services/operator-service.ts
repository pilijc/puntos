import { supabase } from "@/supabase/supabase";
import { parseQRCode, createQRTransaction } from "@/services/qr-service";
import { FrontDeskScanResult, ScanResult } from "@/type/qr-transaction";

 /*
export async function scanQRCode(
  qrId: string,
  operatorId: string,
  storeId: string,
  pointsEarned: number
): Promise<ScanResult> {
 
  // 1. Fetch QR codes table
  const { data: qrData, error: fetchError } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qrId)
    .single();

  if (fetchError || !qrData) {
    return { success: false, message: "QR code not found" };
  }

  // VALIDATION: Check if QR is already used
  const now = new Date();
  if (qrData.is_used) {
    return { success: false, message: "QR code has already been used" };
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
} */

/**
 * Process a front desk scan from raw QR code data
 * Handles QR parsing, staff authentication, and transaction creation
 */
export async function processFrontDeskScan(
  qrData: string,
  pointsToAward: number = 10
): Promise<FrontDeskScanResult> {
  // 1. Parse the QR code
  const parsed = parseQRCode(qrData);

  if (!parsed) {
    return { success: false, message: "Invalid QR Code. This QR code is not recognized." };
  }

  // 2. Get current staff user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Staff not authenticated." };
  }

  // 3. Create QR transaction
  try {
    const transaction = await createQRTransaction(
      parsed.userId,
      user.id,
      pointsToAward
    );

    return {
      success: true,
      message: "Customer QR scanned successfully",
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, message: "Failed to process QR code. Please try again." };
  }
}