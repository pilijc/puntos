export interface RecentTransactionsProps {
  recentScans: Array<{
    points: number;
    timestamp: Date;
    amount: number;
    type?: "earned" | "redeemed" | "pending";
    method?: "qr" | "manual" | "voucher";
    customerName?: string;
  }>;
}