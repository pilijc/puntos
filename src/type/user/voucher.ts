 export type Voucher = {
  id: string;
  code: string;
  user_id: string;
  expires_at: string;
  is_used: boolean;
};

export type VoucherGeneratorProps = {
  userId: string;
  durationMinutes?: number; 
  onVoucherReady?: (voucher: Voucher) => void;  
};

export interface VoucherTransaction {
    id: string;
    voucher_id: string;
    user_id: string;
    store_staff_id: string;
    store_id: number;
    amount: number;
    points_earned: number;
    created_at: string;
}

