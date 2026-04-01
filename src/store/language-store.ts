import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { LanguageState } from "@/type/language";

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      initLanguage: () => {
        const { language } = get();
        i18n.changeLanguage(language);
      }
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
