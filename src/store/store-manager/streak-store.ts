import { PointsMode, StreakState } from "@/type/store-manager/streak";
import { create } from "zustand";

export const useStreakStore = create<StreakState>((set) => ({
  points_mode: "fixed",
  setPointsMode: (value: PointsMode) => set({ points_mode: value }),
  fixed_points_per_day: null,
  setFixedPointsPerDay: (value) => set({ fixed_points_per_day: value }),
  starting_points: null,
  setStartingPoints: (value) => set({ starting_points: value }),
  increment_value: null,
  setIncrementValue: (value) => set({ increment_value: value }),
  streak_length: 0,
  setStreakLength: (value) => set({ streak_length: value }),
  max_days_cap: null,
  setMaxDaysCap: (value) => set({ max_days_cap: value }),
  reward_description: "",
  setRewardDescription: (value) => set({ reward_description: value }),

  reset: () => set({
    points_mode: "fixed",
    fixed_points_per_day: null,
    starting_points: null,
    increment_value: null,
    streak_length: 0,
    max_days_cap: null,
    reward_description: "",
  }),
}));
