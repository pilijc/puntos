import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId } from '@/services/access-service';
import { checkIfAccountDeletedService, AccountDeletedError } from '@/services/auth-service';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuthListener() {
  const router = useRouter();

  useEffect( () => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {        
        if (event === 'PASSWORD_RECOVERY' && session) {
          console.log("Password recovery session started for:", session.user.email);
          router.replace("/reset-password");
        } else if (event === 'SIGNED_IN' && session) {
          console.log("User logged in:", session.user.email);

          try {
            // Save session token if missing
            const sessionToken = await AsyncStorage.getItem('sessionToken');
            if (!sessionToken && session.access_token) {
              await AsyncStorage.setItem('sessionToken', session.access_token);
            }

            // Verify account is not deleted
            await checkIfAccountDeletedService(session.user.id);

            // Determine and navigate to the home route
            const nextRoute = await getHomeRouteForUserId(session.user.id);
            router.replace(nextRoute as any);
          } catch (err: any) {
            if (err instanceof AccountDeletedError) {
              Alert.alert("Login Failed", err.message);
              router.replace("/(auth)/login");
            } else {
              console.error("Auth listener session error:", err);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User logged out");
          router.replace("/(onboarding)/index");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
}
