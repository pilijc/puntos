import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  sessionToken?: string | null;

  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setShowPassword: (v: boolean) => void;
  setShowConfirmPassword: (v: boolean) => void;
  setSessionToken: (t: string | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      sessionToken: null,

      setName: (name) => set({ name }),
      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
      setShowPassword: (showPassword) => set({ showPassword }),
      setShowConfirmPassword: (showConfirmPassword) => set({ showConfirmPassword }),
      setSessionToken: (sessionToken) => set({ sessionToken }),

      reset: () =>
        set({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          showPassword: false,
          showConfirmPassword: false,
          sessionToken: null,
        }),
    }),
    {
      name: "sessionToken",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        name: state.name,
        email: state.email,
        sessionToken: state.sessionToken,
      }),
    }
  )
);