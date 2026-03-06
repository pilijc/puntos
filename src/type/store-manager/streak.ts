export interface Streak {
  id?: string | null;
  store_id: string;
  points_per_day: number | null;
  streak_length: number | null;
  max_days_cap: number | null;
  reward_description: string;
}

export interface StreakState {
  points_per_day: number | null ;
  setPointsPerDay:(value: number) => void;
  streak_length: number | null;
  setStreakLength:(value: number) => void;
  max_days_cap: number | null;
  setMaxDaysCap:(value: number | null) => void;
  reward_description: string;
  setRewardDescription:(value: string) => void;
  reset: () => void;
}
