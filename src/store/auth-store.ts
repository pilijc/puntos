import { create } from "zustand";
import { Auth, GoogleAuth } from "../type/auth";
import { supabase } from "@/supabase/supabase";
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

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

export const useGoogleAuthStore = create<GoogleAuth>((set) => ({
  session: null,
  user: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })
  },

  signInWithGoogle: async () => {
    const redirectUri = Linking.createURL('auth/callback', {
      scheme: 'puntos'
    })
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri },
    })

    if (error) throw error

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    )

    if (result.type !== 'success') return

    await supabase.auth.exchangeCodeForSession(result.url)
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))