import { supabase } from "@/supabase/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHomeRouteForUserId } from "./access-service";
import { router } from "expo-router";

/**
 * Custom error thrown when an account has been marked as deleted.
 */
export class AccountDeletedError extends Error {
  constructor() {
    super("Invalid login credentials.");
    this.name = "AccountDeletedError";
  }
}

/**
 * Checks if a user's account has been soft-deleted.
 * If deleted, it signs the user out and throws an AccountDeletedError.
 */
export async function checkIfAccountDeletedService(userId: string): Promise<void> {
  const { data: userSettings, error } = await supabase
    .from("user_settings")
    .select("deleted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (userSettings?.deleted_at) {
    await supabase.auth.signOut();
    throw new AccountDeletedError();
  }
}

/**
 * Soft-deletes a user account by setting the deleted_at timestamp.
 */
export async function softDeleteUserService(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw error;
  await supabase.auth.signOut();
}

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


export class GoogleSignInCancelledError extends Error {
  constructor() {
    super("Sign in cancelled");
    this.name = "GoogleSignInCancelled";
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
    } else {
      throw new GoogleSignInCancelledError();
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
    return { ...res, homeRoute };
  } catch (error: any) {
    console.log("error login service", error);
    throw error;
  }
}

export async function resetPasswordService(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'puntos://reset-password',
    });
    if (error) {
      throw error;
    }
    return data;
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