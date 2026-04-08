import { supabase } from "@/supabase/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHomeRouteForUserId, getRoleTypeForUser } from "./access-service";
import { router } from "expo-router";
 
export class AccountDeletedError extends Error {
  constructor() {
    super("Invalid login credentials.");
    this.name = "AccountDeletedError";
  }
}

/**
 * Custom error thrown when an account has been blocked by super admin.
 */
export class AccountBlockedError extends Error {
  constructor() {
    super("Your account has been restricted. To verify your account status, please contact support.");
    this.name = "AccountBlockedError";
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
 * Checks if a user is blocked in public.users. If blocked, signs out and throws AccountBlockedError.
 * Blocked users cannot use their account.
 */
export async function checkIfAccountBlockedService(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("users")
    .select("blocked")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.blocked === true) {
    throw new AccountBlockedError();
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

export default async function signUpService(email: string, password: string, name: string, role: string) {
  try {

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) throw error;

    if (!data.user) throw new Error("User not created");

    const userId = data.user.id;

    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("users").insert({
        id: userId,
        name,
        email
      });
    } 
    const roleToId: Record<string, number> = { user: 4, manager: 2 };
    const roleId = roleToId[role] || 4;  



    const { data: roleInsertData, error: roleError } = await supabase.from("user_roles").insert({ 
      user_id: data.user.id, 
      role_id: roleId, 
      store_id: null 
    });

    if (roleError) {
      //console.error("Role insertion failed:", roleError);
      throw roleError;
    }
    //console.log("Role insertion successful:", roleInsertData);
    const homeRoute = await getHomeRouteForUserId(userId);
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
        await checkIfAccountBlockedService(data.user.id);
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
         
          await supabase.from("user_roles").insert({ user_id: data.user.id, role_id: 4, store_id: null });
        } else {
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role_id")
            .eq("user_id", data.user.id)
            .maybeSingle();
          
          if (!existingRole) {
            await supabase.from("user_roles").insert({ user_id: data.user.id, role_id: 4, store_id: null });
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
    
    if (res.error) throw res.error;
    const userId = res.data?.user?.id;
    if(!userId) throw new Error("Login Failed");

    await checkIfAccountBlockedService(userId);
    const roleType = await getRoleTypeForUser(userId);

    if (roleType === "front_desk") {
        const { data: storeStaff, error } = await supabase
          .from("store_staff")
          .select("store_id")
          .eq("user_id", userId)
          .single();

        if (error || !storeStaff?.store_id) {
          await supabase.auth.signOut();   
          await AsyncStorage.removeItem("sessionToken");
          
           return {
              success: false,
              homeRoute: null,
              message:
                "You are not assigned to any store. Please contact your administrator.",
            };
         }     
      }

    // if (res.data?.session?.access_token) {
    //   await AsyncStorage.setItem('sessionToken', res.data.session.access_token);
    // }
    const homeRoute = userId ? await getHomeRouteForUserId(userId) : null;
    return { success: true,
             homeRoute,
    }; 
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
        await checkIfAccountBlockedService(data.user.id);
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

export async function isEmailTaken(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")       
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return false;  
  }
  return !!data;  
}


 
