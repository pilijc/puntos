import { supabase } from "@/supabase/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default async function signUpService(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log(data);
    console.log(error);
    if (error) throw error;

    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        name,
      });

      if (insertError) throw insertError;
    }
  } catch (error) {
    throw error;
  }
}

export async function signUpWithGoogleService() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    console.log("sign up with google service", response);

    if (response.type === 'success') {
      const idToken = response.data.idToken;

      if (idToken) {
        await AsyncStorage.setItem('sessionToken', idToken);
      } else {
        throw new Error(
          'Google Sign-In did not return an ID token'
        );
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const name = data.user.user_metadata.full_name

        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: data.user.id,
              name: name,
            });

          if (insertError) {
            throw insertError;
          }
        }
      }
      return data;
    }
  } catch (error: any) {
    throw error;
  }
}

export async function loginService(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    throw error;
  }
};

export async function signInWithGoogleLoginService() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    console.log(response);

    if (response.type === 'success') {
      const { idToken } = response.data;

      if (!idToken) {
        throw new Error(
          'Google Sign-In did not return an ID token'
        );
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const name = data.user.user_metadata?.full_name ?? data.user.email ?? 'User';

        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: data.user.id,
              name,
            });

          if (insertError) {
            throw insertError;
          }
        }
      }

      return data;
    }
  } catch (error: any) {
    throw error;
  }
}