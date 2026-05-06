import { Reward } from "@/type/store-manager/reward";
import { Dispatch, SetStateAction } from "react";

export type ExpirationMode = "none" | "card";

export type ProgramStatus = "active" | "ended_grace" | "ended_expired" | "draft" | "ended";

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
  totalStampsError: boolean;
  rewardError: boolean;
  expirationDaysError: boolean;
  setTotalStamps: (total_stamps: number) => void;
  setRewardId: (reward_id: string) => void;
  setExpirationMode: (mode: ExpirationMode) => void;
  setExpirationDays: (days: number) => void;
  setTotalStampsError: (value: boolean) => void;
  setRewardError: (value: boolean) => void;
  setExpirationDaysError: (value: boolean) => void;
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

export const STATUS_BADGE: Record<
  ProgramStatus,
  { label: string; color: string; dot: string; text: string }
> = {
  active: {
    label: "Active",
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  ended_grace: {
    label: "Grace Period",
    color: "bg-amber-50 dark:bg-amber-900/20",
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  ended_expired: {
    label: "Expired",
    color: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  },
  draft: {
    label: "Draft",
    color: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  }, 
  ended: {
    label: "Ended",
    color: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  },
};

export type CollectorSlice = {
  collectorsOpen: boolean;
  collectors: StampCollector[];
  collectorsCount: number;
  collectorsPage: number;
  collectorsLoading: boolean;
  loadingMore: boolean;
  hasLoadedCollectorsOnce: boolean;
};

export const emptyCollectorSlice = (): CollectorSlice => ({
  collectorsOpen: false,
  collectors: [],
  collectorsCount: 0,
  collectorsPage: 0,
  collectorsLoading: false,
  loadingMore: false,
  hasLoadedCollectorsOnce: false,
});

export type RewardPickerModalProps = {
  visible: boolean;
  storeId: string;
  selectedRewardId: string;
  onClose: () => void;
  onSelect: (reward: Reward) => void;
};

export type StampCardProps = {
  stamp: Stamp;
  reward: Reward | null;
  activeTab: TabKey;
  isDark: boolean;
  readonlyCampaigns?: boolean;
  collector: CollectorSlice;
  programId: number;
  setCollectorByProgram: Dispatch<SetStateAction<Record<number, CollectorSlice>>>;
  loadCollectorsFirstPage: (programId: number) => void;
  activeProgramCount: number;
  doActivate: (programId: number) => void | Promise<void>;
  doEnd: (programId: number, graceDays: number) => void | Promise<void>;
  doDelete: (programId: number) => void | Promise<void>;
  onEditDraft?: () => void;
  setModal: (modal: StampModalState) => void;
  endingId: number | null;
};