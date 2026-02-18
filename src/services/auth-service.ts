import { supabase } from "@/supabase/supabase";
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin'

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
    console.log('Starting Google Sign-In...');
    
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();
    
    const response = await GoogleSignin.signIn();
    console.log('Google Sign-In response:', response);
    
    if (response.type === 'success') {
      const { idToken } = response.data;
      
      if (!idToken) {
        console.error('No ID token received from Google');
        console.error('Response data:', response.data);
        throw new Error(
          'Google Sign-In did not return an ID token. ' +
          'Please check your Google Cloud Console configuration.'
        );
      }
      
      console.log('Got ID token, signing in to Supabase...');
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) {
        console.error('Supabase sign-in error:', error);
        throw error;
      }
      
      console.log('Supabase session created:', data.user);
      
      if (data.user) {
        const name = data.user.user_metadata.full_name
        
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();
        
        if (!existingProfile) {
          console.log('Creating profile...');
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              name: name,
            });
          
          if (insertError) {
            console.error('Profile creation error:', insertError);
          } else {
            console.log('Profile created successfully');
          }
        }
      }
      
      return data;
    }
  } catch (error: any) {
      throw error;
  }
}