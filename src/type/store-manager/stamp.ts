export type ExpirationMode = "none" | "card";

export interface Stamp {
  id?: number;
  store_id: string;
  total_stamps: number;
  reward_id: string;
  expiration_mode: ExpirationMode;
  expiration_days?: number | null;
  is_active?: boolean;
  ended_at?: string | null;
  redemption_deadline?: string | null;
  created_at?: string;
}

export interface StampStore {
  total_stamps: number;
  reward_id: string;
  expiration_mode: ExpirationMode;
  expiration_days: number;
  setTotalStamps: (total_stamps: number) => void;
  setRewardId: (reward_id: string) => void;
  setExpirationMode: (mode: ExpirationMode) => void;
  setExpirationDays: (days: number) => void;
  reset: () => void;
}
