import { create } from "zustand";
import { Auth } from "../type/auth";

export const useAuthStore = create<Auth>((set) => ({
  username: "",
  email: "",
  password: "",
	showPassword: false,

	setUsername: (username) => set({ username}),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
	setShowPassword: (showPassword) => set({ showPassword}),

  reset: () =>
    set({
			username: "",
      email: "",
      password: "",
			showPassword: false,
    }),
}));
