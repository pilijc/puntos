import { supabase } from "@/supabase/supabase";
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default async function signUpService ( email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name,
      });
      if (insertError) throw insertError;
    }
  } catch (error) {
    throw error;
  } 
}

export async function signInWithGoogleService() {
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
        const name = data.user.user_metadata.full_name
        
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();
        
        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from("profiles")
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