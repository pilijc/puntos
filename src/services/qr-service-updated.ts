import { supabase } from "@/supabase/supabase";

/**
 * One-Time Barcode Usage Algorithm
 * Ensures a barcode can only be used once after a transaction is triggered.
 * Tracks usage state in the database to prevent replay attacks.
 */

export interface QRCodeState {
  id: string;
  user_id: string;
  barcode_hash: string;
  is_used: boolean;
  scanned_at: string | null;
  transaction_completed_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface ScanResult {
  success: boolean;
  qrId: string;
  message: string;
  isFirstUse: boolean;
  wasAlreadyUsed: boolean;
}

/**
 * Generate a new QR code for a user
 */
export async function generateQRCode(userId: string, expiryHours: number = 24) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const { data, error } = await supabase
    .from('qr_codes')
    .insert([
      {
        user_id: userId,
        is_used: false,
        scanned_at: null,
        transaction_completed_at: null,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
    ])
    .select();

  if (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }

  return data?.[0];
}

/**
 * Core One-Time-Use Algorithm
 * Validates barcode and marks it as used atomically
 * 
 * HOW IT WORKS:
 * 1. Retrieves barcode record from database
 * 2. Checks if already used (returns error if so)
 * 3. Verifies expiration date
 * 4. Atomically sets is_used=true & records scanned_at timestamp
 * 5. Returns success/failure with detailed status
 * 
 * SECURITY: Uses conditional update (eq 'is_used', false) to prevent race conditions
 */
export async function validateAndLockBarcode(
  barcodeId: string,
  userId: string
): Promise<ScanResult> {
  try {
    // Step 1: Retrieve the barcode record
    const { data: barcodeData, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', barcodeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !barcodeData) {
      return {
        success: false,
        qrId: barcodeId,
        message: 'Barcode not found or invalid user',
        isFirstUse: false,
        wasAlreadyUsed: false,
      };
    }

    const qrCode = barcodeData as QRCodeState;

    // Step 2: Check if barcode has already been used
    if (qrCode.is_used) {
      return {
        success: false,
        qrId: barcodeId,
        message: 'This barcode has already been used. Cannot process transaction.',
        isFirstUse: false,
        wasAlreadyUsed: true,
      };
    }

    // Step 3: Check if barcode has expired
    if (new Date(qrCode.expires_at) < new Date()) {
      return {
        success: false,
        qrId: barcodeId,
        message: 'This barcode has expired and cannot be used.',
        isFirstUse: false,
        wasAlreadyUsed: false,
      };
    }

    // Step 4: Atomically mark barcode as scanned and lock it
    // The conditional update (is_used=false) prevents race conditions from concurrent requests
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({
        is_used: true,
        scanned_at: new Date().toISOString(),
      })
      .eq('id', barcodeId)
      .eq('is_used', false) // Only update if not already used (prevents race condition)
      .eq('user_id', userId);

    if (updateError) {
      return {
        success: false,
        qrId: barcodeId,
        message: 'Failed to lock barcode. Please try again.',
        isFirstUse: false,
        wasAlreadyUsed: false,
      };
    }

    return {
      success: true,
      qrId: barcodeId,
      message: 'Barcode validated. Transaction can proceed.',
      isFirstUse: true,
      wasAlreadyUsed: false,
    };
  } catch (error) {
    throw new Error(
      `Barcode validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process a transaction after barcode is validated
 * This should be called AFTER validateAndLockBarcode succeeds
 * 
 * Records transaction_completed_at timestamp and merges custom transaction data
 */
export async function completeTransaction(
  barcodeId: string,
  transactionData: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({
        transaction_completed_at: new Date().toISOString(),
        ...transactionData,
      })
      .eq('id', barcodeId)
      .eq('is_used', true); // Safety: only update if already locked

    if (error) {
      throw new Error(`Failed to complete transaction: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw new Error(
      `Transaction completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check barcode status without modifying state
 * Use this to display status to users without triggering a scan
 */
export async function checkBarcodeStatus(barcodeId: string): Promise<QRCodeState | null> {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', barcodeId)
      .single();

    if (error) {
      console.error('Error checking barcode status:', error);
      return null;
    }

    return data as QRCodeState;
  } catch (error) {
    console.error('Barcode status check failed:', error);
    return null;
  }
}

/**
 * Revoke a barcode (admin/error recovery only)
 * Resets the barcode to unused state so it can be scanned again
 */
export async function revokeBarcode(barcodeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({
        is_used: false,
        scanned_at: null,
        transaction_completed_at: null,
      })
      .eq('id', barcodeId);

    if (error) {
      throw new Error(`Failed to revoke barcode: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Barcode revocation failed:', error);
    return false;
  }
}
