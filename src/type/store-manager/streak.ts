export type StreakStatus = "draft" | "upcoming" | "active" | "ended";

export type PointsMode = "fixed" | "incremental";

export type StreakTabKey = "active" | "upcoming" | "ended";

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
  start_date?: string | null;
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
  setPointsMode: (value: PointsMode) => void;
  fixed_points_per_day: number | null;
  setFixedPointsPerDay: (value: number | null) => void;
  starting_points: number | null;
  setStartingPoints: (value: number | null) => void;
  increment_value: number | null;
  setIncrementValue: (value: number | null) => void;
  streak_length: number | null;
  setStreakLength: (value: number) => void;
  max_days_cap: number | null;
  setMaxDaysCap: (value: number | null) => void;
  reward_description: string;
  setRewardDescription: (value: string) => void;
  reset: () => void;
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
