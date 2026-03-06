import { StreakState } from "@/type/store-manager/streak";
import { create } from "zustand";

export const useStreakStore = create<StreakState>((set) => ({
  points_per_day: 0,
  streak_length: 0,
  max_days_cap: 0,
  reward_description: "",

  setPointsPerDay: (value: number) => set({ points_per_day: value }),
  setStreakLength: (value: number) => set({ streak_length: value }),
  setMaxDaysCap: (value: number | null) => set({ max_days_cap: value }),
  setRewardDescription: (value: string) => set({ reward_description: value }),

  reset: () => set({
    points_per_day: 0,
    streak_length: 0,
    max_days_cap: 0,
    reward_description: "",
  }),
}));
