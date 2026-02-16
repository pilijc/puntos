import { supabase } from "@/supabase/supabase";
import { useAuthStore, useGoogleAuthStore } from "../store/auth-store";

export default async function signUpService ( email: string, password: string, username: string) {
  const { reset } = useAuthStore();
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username,
      });
      if (insertError) throw insertError;
    }
  } catch (error) {
    throw error;
  } finally {
    reset();
  }
}

export async function signInWithGoogleService() {
  const { init, user } = useGoogleAuthStore();
  try {
    await init();
    if (user) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        username: user.username,
      });
      if (insertError) throw insertError;
    }
  } catch (error) {
    throw error;
  }
}