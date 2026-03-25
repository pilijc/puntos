export interface ScanResult {
  success: boolean;
  message: string;
  pointsEarned?: number;
}

export interface FrontDeskScanResult {
  success: boolean;
  message: string;
  transactionId?: string;
  pointsEarned?: number;
}

