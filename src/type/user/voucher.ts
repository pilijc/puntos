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

