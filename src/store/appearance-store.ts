import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import { AppearanceState } from "@/type/appearance";

export type ThemeType = 'light' | 'dark' | 'system';

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (newTheme: ThemeType) => {
        set({ theme: newTheme });
        get().applyTheme();
      },

      applyTheme: () => {
        const { theme } = get();
        if (Platform.OS === 'web') {
          const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.classList.toggle('dark', isDark);
          return;
        }
        if (theme === 'system') {
          Appearance.setColorScheme(null as unknown as ColorSchemeName);
        } else {
          Appearance.setColorScheme(theme);
        }
      }
    }),

    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if(state) {
          state.applyTheme();
        }
      },
    }
  )
);
Appearance.addChangeListener(() => {
  const state = useAppearanceStore.getState();
  if (state.theme === 'system') {
    state.applyTheme();
  }
});

import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    const state = useAppearanceStore.getState();
    if (state.theme === 'system') {
      state.applyTheme();
    }
  }
});