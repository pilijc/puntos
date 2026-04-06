import { ThemeType } from "@/store/appearance-store";

export interface AppearanceState {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    applyTheme: () => void;
}