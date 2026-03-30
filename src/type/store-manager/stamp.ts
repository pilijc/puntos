import { Reward } from "@/type/store-manager/reward";

export type ExpirationMode = "none" | "card";

export type ProgramStatus = "active" | "ended_grace" | "ended_expired";

export type TabKey = "draft" | "active" | "ended";

export const Tabs = [
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "ended", label: "Ended" },
] as const;

export interface Stamp {
  id?: number;
  store_id: string;
  total_stamps: number;
  reward_id: string;
  status?: "draft" | "active" | "ended";
  expiration_mode: ExpirationMode;
  expiration_days?: number | null;
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

export type StampModalState =
  | {
      title: string;
      message: string;
      buttons: {
        label: string;
        variant?: "primary" | "secondary" | "danger";
        onPress: () => void;
      }[];
    }
  | null;

export interface StampViewState {
  activeTab: TabKey;
  stamps: Stamp[];
  rewards: Reward[];
  loading: boolean;
  endingId: number | null;
  modal: StampModalState;
  setActiveTab: (activeTab: TabKey) => void;
  setStamps: (stamps: Stamp[]) => void;
  setRewards: (rewards: Reward[]) => void;
  setLoading: (loading: boolean) => void;
  setEndingId: (endingId: number | null) => void;
  setModal: (modal: StampModalState) => void;
}

export interface StampConfigureViewState {
  isSubmitting: boolean;
  checkingActive: boolean;
  rewards: Reward[];
  modal: StampModalState;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setCheckingActive: (checkingActive: boolean) => void;
  setRewards: (rewards: Reward[]) => void;
  setModal: (modal: StampModalState) => void;
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

export const EXPIRATION_OPTIONS: { key: ExpirationMode; label: string; description: string; icon: string }[] = [
  {
    key: "none",
    label: "No Expiration",
    description: "Stamps never expire until the user completes the card.",
    icon: "all-inclusive",
  },
  {
    key: "card",
    label: "Card Expiration",
    description: "The entire stamp card expires if not completed within a set number of days.",
    icon: "timer",
  },
];
