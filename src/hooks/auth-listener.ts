import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId, getWebAdjustedHomeRoute } from '@/services/access-service';
import { checkIfAccountDeletedService, checkIfAccountBlockedService, AccountDeletedError, AccountBlockedError } from '@/services/auth-service';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { upsertPushId, isOneSignalNativeAvailable } from '@/services/push-service';
import { useAuthStore } from '@/store/auth-store';
import { markIntentionalSignOut, consumeIntentionalSignOut } from '@/lib/intentional-signout';
import { registerDeviceSessionForRoute, forceDeactivateAllDeviceSessions } from '@/services/shared/device-session-route-service';

let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;

if (Platform.OS !== "web") {
  OneSignal = require("react-native-onesignal").OneSignal;
}

export function useAuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isOnSignupFlow = pathname?.includes('/signup');
        
        if (event === 'PASSWORD_RECOVERY' && session) {
          router.replace("/reset-password");
        } else if (event === 'SIGNED_OUT') {
          const intentional = consumeIntentionalSignOut();
          // Deactivate this device across all role session tables.
          // Only one table will have a matching row; the others are no-ops.
          forceDeactivateAllDeviceSessions();

          // if we're already on the login page or auth/signup flows, don't boot the user back to welcome.
          // this allows them to stay on login after cancelling a device limit modal.
          const isAtAuthFlow =
            pathname?.includes('/login') ||
            pathname?.includes('/signup') ||
            pathname?.includes('/welcome') ||
            pathname?.includes('/landing');

          void (async () => {
            try {
              await AsyncStorage.removeItem('sessionToken');
              useAuthStore.getState().setSessionToken(null);
            } catch {
              // ignore
            }
            if (!intentional && !isAtAuthFlow) {
              useAuthStore.getState().setSessionExpiredNotice(true);
            }
            if (!isAtAuthFlow) {
              router.replace("/(onboarding)/welcome");
            }
          })();
        } else if (event === 'SIGNED_IN' && session && !isOnSignupFlow) {
          useAuthStore.getState().setSessionExpiredNotice(false);
          void (async () => {
            try {
              const sessionToken = await AsyncStorage.getItem('sessionToken');
              if (!sessionToken && session.access_token) {
                await AsyncStorage.setItem('sessionToken', session.access_token);
              }

              const tokenToUse = sessionToken ?? session.access_token ?? null;
              if (!tokenToUse) {
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

              const isAtAuthFlow =
                pathname?.includes('/login') ||
                pathname?.includes('/signup') ||
                pathname?.includes('/welcome') ||
                pathname?.includes('/landing');

              try {
                const sessionCheck = await registerDeviceSessionForRoute(userId, nextRoute);
                if (!sessionCheck.allowed) {
                  if (isAtAuthFlow) return;
                  markIntentionalSignOut();
                  await supabase.auth.signOut();
                  router.replace("/(auth)/login");
                  return;
                }
              } catch (e) {
                // Network / RPC failure — fail open so a transient error doesn't log the user out.
                console.warn("[AuthListener] Device session check failed, proceeding:", e);
              }

              router.replace(nextRoute as any);
              } catch (err: any) {
              if (err instanceof AccountDeletedError) {
                Alert.alert("Login Failed", err.message);
                router.replace("/(auth)/login");
              } else if (err instanceof AccountBlockedError) {
                useAuthStore.getState().setRestricted(true);
              } else {
                consumeIntentionalSignOut();
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
