import { create } from "zustand";
import { Auth } from "../type/auth";

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
