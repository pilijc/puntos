export type StreakStatus = "draft" | "upcoming" | "active" | "ended";

export type PointsMode = "fixed" | "incremental";

export type StreakTabKey = "active" | "upcoming" | "ended";
export type StreakActionType = "publish" | "activate" | "end";

export const StatusBadgeProps = {
  draft: {
    label: "Draft",
    color: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  },
  upcoming: {
    label: "Upcoming",
    color: "bg-blue-50 dark:bg-blue-900/20",
    dot: "bg-blue-400",
    text: "text-blue-600 dark:text-blue-400",
  },
  active: {
    label: "Active",
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  ended: {
    label: "Ended",
    color: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  },
} as const;

export const StreakTabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "ended", label: "Ended" },
] as const;

export interface Streak {
  id?: number | null;
  store_id: string;
  title?: string | null;
  fixed_points_per_day?: number | null;
  streak_length: number | null;
  max_days_cap: number | null;
  reward_description: string;
  start_at?: string | null;
  end_date?: string | null;
  status?: StreakStatus;
  ended_at?: string | null;
  points_mode?: PointsMode;
  starting_points?: number | null;
  increment_value?: number | null;
  completion_bonus_points?: number;
  radius_meters?: number | null;
  created_at?: string;
}

export interface StreakParticipant {
  user_id: string;
  store_streak_id: number;
  total_earned_days: number;
  points_earned: number;
  completion_bonus_awarded: boolean;
  completed_at: string | null;
  status: "in_progress" | "completed" | "ended";
  users: {
    name: string;
    avatar_url?: string;
  } | null;
}

export interface StreakState {
  points_mode: PointsMode;
  fixed_points_per_day: number | null;
  starting_points: number | null;
  increment_value: number | null;
  streak_length: number | null;
  max_days_cap: number | null;
  reward_description: string;
  start_at: string | null;
  min_start_at: string | null;
  showStartDatePicker: boolean;
  showStartTimePicker: boolean;
  isSubmitting: boolean;
  modal: {
    title: string;
    message: string;
    buttons: { label: string; onPress: () => void; variant?: "primary" | "success" | "danger" | "secondary" | "ghost"; loading?: boolean; disabled?: boolean; timer?: number }[];
    timer?: boolean;
  } | null;

  setPointsMode: (value: PointsMode) => void;
  setFixedPointsPerDay: (value: number | null) => void;
  setStartingPoints: (value: number | null) => void;
  setIncrementValue: (value: number | null) => void;
  setStreakLength: (value: number) => void;
  setMaxDaysCap: (value: number | null) => void;
  setRewardDescription: (value: string) => void;
  setStartAt: (value: string | null) => void;
  setMinStartAt: (value: string | null) => void;
  setShowStartDatePicker: (value: boolean) => void;
  setShowStartTimePicker: (value: boolean) => void;
  setIsSubmitting: (value: boolean) => void;
  setModal: (value: StreakState["modal"]) => void;
  reset: () => void;
}

export interface StreakViewState {
  activeTab: StreakTabKey;
  streaks: Streak[];
  loading: boolean;
  acting: { id: number; action: StreakActionType } | null;
  modal: {
    title: string;
    message: string;
    buttons: { label: string; onPress: () => void; variant?: "primary" | "success" | "danger" | "secondary" | "ghost"; loading?: boolean; disabled?: boolean; timer?: number }[];
  } | null;

  setActiveTab: (value: StreakTabKey) => void;
  setStreaks: (value: Streak[]) => void;
  setLoading: (value: boolean) => void;
  setActing: (value: { id: number; action: StreakActionType } | null) => void;
  setModal: (value: StreakViewState["modal"]) => void;
  resetView: () => void;
}

export interface StreakCardProps {
  streak: Streak;
  isDark: boolean;
  onPublish?: () => void;
  onActivate?: () => void;
  onEnd?: () => void;
  isPublishing?: boolean;
  isActivating?: boolean;
  isEnding?: boolean;
}
