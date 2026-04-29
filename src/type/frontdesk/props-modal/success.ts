
export interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  successPoints: number;
  type?: "earn" | "redeem";
  rewardName?: string;
  rewardImage?: string | null;
}