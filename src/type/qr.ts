export interface QRCodeState {
  id: string;
  user_id: string | null;
  barcode_hash: string | null;
  store_staff_id: string | null;
  is_used: boolean;
  scanned_at: string | null;
  transaction_completed_at: string | null;
  created_at: string;
  expires_at: string;
}