import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { getHomeRouteForUserId, getWebAdjustedHomeRoute } from '@/services/access-service';
import { checkIfAccountDeletedService, checkIfAccountBlockedService, AccountDeletedError, AccountBlockedError } from '@/services/auth-service';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { upsertPushId, isOneSignalNativeAvailable } from '@/services/push-service';
import { useAuthStore } from '@/store/auth-store';

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
          console.log("Password recovery session started for:", session.user.email);
          router.replace("/reset-password");
        } else if (event === 'SIGNED_OUT') {
          console.log("User logged out");
          try {
            const { forceDeactivateCurrentDeviceService } = require("@/services/store-manager/device-session-service");
            forceDeactivateCurrentDeviceService().catch((e: any) => console.warn("[AuthListener] Force deactivate failed", e));
          } catch (e) {
            // ignore
          }

          // if we're already on the login page or auth/signup flows, don't boot the user back to welcome.
          // this allows them to stay on login after cancelling a device limit modal.
          const isAtAuthFlow = pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/welcome');
          
          if (!isAtAuthFlow) {
            router.replace("/(onboarding)/welcome");
          }
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

              const isAtAuthFlow = pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/welcome');

              // Enforce device session limit to prevent the global listener from hijacking routing into the dashboard!
              if (nextRoute === "/(store_manager)" || (typeof nextRoute === "string" && nextRoute.startsWith("/(store_manager)"))) {
                const { checkDeviceSessionLimitService, upsertDeviceSessionService } = require("@/services/store-manager/device-session-service");
                try {
                  const sessionCheck = await checkDeviceSessionLimitService(userId);
                  if (sessionCheck.allowed) {
                    await upsertDeviceSessionService(userId);
                  } else {
                    // If we're on the login page, we let the login page itself handle the modal state.
                    // We simply return so line 72 doesn't execute and "unhide" the auth screen.
                    if (isAtAuthFlow) return;

                    // Otherwise, if we're on a dashboard route but somehow lost our session slot, boot to login.
                    await supabase.auth.signOut();
                    router.replace("/(auth)/login");
                    return; 
                  }
                } catch (e) {
                  console.warn("[AuthListener] Device session check failed", e);
                }
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
