export type ExpirationMode = "none" | "card";

export type ProgramStatus = "active" | "ended_grace" | "ended_expired";

export type TabKey = "active" | "inactive";

export const Tabs = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

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

export interface StampCollector {
  user_id: string;
  stamps_count: number;
  target: number;
  last_stamp_at: string;
  updated_at: string;
  card_status: "active" | "completed" | "expired";
  card_expires_at: string | null;
  users: {
    name: string;
    avatar_url?: string;
  } | null;
}
