export interface LanguageState {
  language: 'en' | 'ja';
  setLanguage: (lang: 'en' | 'ja') => void;
  initLanguage: () => void;
}