import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId } from '@/services/access-service';
import { checkIfAccountDeletedService, AccountDeletedError } from '@/services/auth-service';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuthListener() {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          console.log("Password recovery session started for:", session.user.email);
          router.replace("/reset-password");
        } else if (event === 'SIGNED_OUT') {
          console.log("User logged out");
          router.replace("/(onboarding)/welcome");
        } else if (event === 'SIGNED_IN' && session) {
          console.log("User logged in:", session.user.email);
          void (async () => {

            try {
              const sessionToken = await AsyncStorage.getItem('sessionToken');
              if (!sessionToken && session.access_token) {
                await AsyncStorage.setItem('sessionToken', session.access_token);
              }

              const tokenToUse = sessionToken ?? session.access_token ?? null;
              if (!tokenToUse) {
                console.log('No session token found in AsyncStorage or session; staying on auth screens.');
                return;
              }

              await checkIfAccountDeletedService(session.user.id);

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
          })();
        }
        return () => {
          listener.subscription.unsubscribe();
        };
      })
  }
  );
}
