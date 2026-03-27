import { PointsMode, StreakState, StreakViewState } from "@/type/store-manager/streak";
import { create } from "zustand";

export const useStreakStore = create<StreakState>((set) => ({
  points_mode: "fixed",
  fixed_points_per_day: null,
  starting_points: null,
  increment_value: null,
  streak_length: 0,
  max_days_cap: null,
  reward_description: "",
  start_at: null,
  min_start_at: null,
  showStartDatePicker: false,
  showStartTimePicker: false,
  isSubmitting: false,
  modal: null,

  setPointsMode: (value: PointsMode) => set({ points_mode: value }),
  setFixedPointsPerDay: (value) => set({ fixed_points_per_day: value }),
  setStartingPoints: (value) => set({ starting_points: value }),
  setIncrementValue: (value) => set({ increment_value: value }),
  setStreakLength: (value) => set({ streak_length: value }),
  setMaxDaysCap: (value) => set({ max_days_cap: value }),
  setRewardDescription: (value) => set({ reward_description: value }),
  setStartAt: (value) => set({ start_at: value }),
  setMinStartAt: (value) => set({ min_start_at: value }),
  setShowStartDatePicker: (value) => set({ showStartDatePicker: value }),
  setShowStartTimePicker: (value) => set({ showStartTimePicker: value }),
  setIsSubmitting: (value) => set({ isSubmitting: value }),
  setModal: (value) => set({ modal: value }),

  reset: () => set({
    points_mode: "fixed",
    fixed_points_per_day: null,
    starting_points: null,
    increment_value: null,
    streak_length: 0,
    max_days_cap: null,
    reward_description: "",
    start_at: null,
    min_start_at: null,
    showStartDatePicker: false,
    showStartTimePicker: false,
    isSubmitting: false,
    modal: null,
  }),
}));

export const useStreakViewStore = create<StreakViewState>((set) => ({
  activeTab: "upcoming",
  streaks: [],
  loading: true,
  acting: null,
  modal: null,

  setActiveTab: (value) => set({ activeTab: value }),
  setStreaks: (value) => set({ streaks: value }),
  setLoading: (value) => set({ loading: value }),
  setActing: (value) => set({ acting: value }),
  setModal: (value) => set({ modal: value }),
  resetView: () =>
    set({
      activeTab: "upcoming",
      streaks: [],
      loading: true,
      acting: null,
      modal: null,
    }),
}));
