import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface AppearanceState {
  isDark: boolean;
  toggleTheme: () => void;
  applyTheme: () => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      isDark: Appearance.getColorScheme() === 'dark',
      toggleTheme: () => {
        const newIsDark = !get().isDark;
        set({ isDark: newIsDark });
        Appearance.setColorScheme(newIsDark ? 'dark' : 'light');
      },
      applyTheme: () => {
        const { isDark } = get();
        Appearance.setColorScheme(isDark ? 'dark' : 'light');
      }
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.applyTheme();
        }
      },
    }
  )
);
