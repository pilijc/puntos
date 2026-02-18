import { create } from "zustand";
import { Auth, GoogleAuth } from "../type/auth";
import { supabase } from "@/supabase/supabase";
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { Alert } from "react-native";

export const useAuthStore = create<Auth>((set) => ({
  name: "",
  email: "",
  password: "",
	showPassword: false,
  confirmPassword: "",
  showConfirmPassword: false,

	setName: (name) => set({ name}),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
	setShowPassword: (showPassword) => set({ showPassword}),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setShowConfirmPassword: (showConfirmPassword) => set({ showConfirmPassword }),

  reset: () =>
    set({
			name: "",
      email: "",
      password: "",
			showPassword: false,
      confirmPassword: "",
      showConfirmPassword: false,
    }),
}));