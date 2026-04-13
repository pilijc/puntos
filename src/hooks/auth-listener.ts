import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId, getWebAdjustedHomeRoute } from '@/services/access-service';
import { checkIfAccountDeletedService, checkIfAccountBlockedService, AccountDeletedError, AccountBlockedError } from '@/services/auth-service';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { upsertPushId, isOneSignalNativeAvailable } from '@/services/push-notif';
import { useAuthStore } from '@/store/auth-store';
import { OneSignal } from 'react-native-onesignal';

export function useAuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isOnSignupFlow = pathname?.includes('/signup');
        
        if (event === 'PASSWORD_RECOVERY' && session) {
          console.log("Password recovery session started for:", session.user.email);
          router.replace("/reset-password");
        } else if (event === 'SIGNED_OUT') {
          console.log("User logged out");
          router.replace("/(onboarding)/welcome");
        } else if (event === 'SIGNED_IN' && session && !isOnSignupFlow) {
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
              await checkIfAccountBlockedService(session.user.id);

              const userId = session.user.id;
              const nextRoute = getWebAdjustedHomeRoute(await getHomeRouteForUserId(userId));

              if (isOneSignalNativeAvailable()) {
                await OneSignal.login(userId);
                await upsertPushId();
              }

              router.replace(nextRoute as any);
              } catch (err: any) {
              if (err instanceof AccountDeletedError) {
                Alert.alert("Login Failed", err.message);
                router.replace("/(auth)/login");
              } else if (err instanceof AccountBlockedError) {
                useAuthStore.getState().setRestricted(true);
              } else {
                console.error("Auth listener session error:", err);
              }
            }
          })();
        } else if (event === 'SIGNED_IN' && session && isOnSignupFlow) {
          console.log("User has session but is on signup flow - not auto-redirecting");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, pathname]);
}
