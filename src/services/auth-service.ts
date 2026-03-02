import { supabase } from "@/supabase/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHomeRouteForUserId } from "./access-service";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default async function signUpService(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (data?.session?.access_token) {
      await AsyncStorage.setItem('sessionToken', data.session.access_token);
    }
    const homeRoute = data?.user?.id ? await getHomeRouteForUserId(data.user.id) : "/(user)";
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("users").insert({ id: data.user.id, name });
      }
    }else if (error) {
      throw error;
    }
    return { ...data, homeRoute};
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

      const homeRoute = data?.user?.id ? await getHomeRouteForUserId(data.user.id) : "/(user)";

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
              name,
            });

          if (insertError) {
            throw insertError;
          }
        }
      } else if (error) {
        throw error;
      }
      return { ...data, homeRoute };
    }
  } catch (error: any) {
    throw error;
  }
}


export async function loginService(email: string, password: string) {
  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data?.session?.access_token) {
      await AsyncStorage.setItem('sessionToken', res.data.session.access_token);
    }
    if (res.error) throw res.error;
    const userId = res.data?.user?.id;
    const homeRoute = userId ? await getHomeRouteForUserId(userId) : "/(user)";
    return { ...res.data, homeRoute };
  } catch (error: any) {
    throw error;
  }
}

export async function signInWithGoogleLoginService() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (response.type === 'success') {
      const { idToken } = response.data;
      if (idToken) {
        await AsyncStorage.setItem('sessionToken', idToken);
      } 
      const userId = response.data.user.id;
      const homeRoute = userId ? await getHomeRouteForUserId(userId) : "/(user)";

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

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
      } else if (error) {
        throw error;
      }

      return { ...data, homeRoute };
    }
  } catch (error: any) {
    throw error;
  }
}