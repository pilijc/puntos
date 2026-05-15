import "react-native-url-polyfill/auto";
import "react-native-gesture-handler";
import "../global.css";
import "@/translation";
import { Slot, useRouter, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar, Alert, Platform, AppState } from "react-native";
import { supabase } from "@/supabase/supabase";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthListener } from "@/hooks/auth-listener";
import { getHomeRouteForUserId, getWebAdjustedHomeRoute } from "@/services/access-service";
import { checkIfAccountDeletedService, checkIfAccountBlockedService, AccountDeletedError, AccountBlockedError } from "@/services/auth-service";
import { Modal } from "@/components/modal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/auth-store";
import { isOneSignalNativeAvailable } from "@/services/push-service";
import { useStamps } from "@/hooks/use-stamps";
import { useStreaks } from "@/hooks/use-streaks";
import { checkDeviceSessionLimitService, upsertDeviceSessionService } from "@/services/store-manager/device-session-service";
import { markIntentionalSignOut } from "@/lib/intentional-signout";
import { useTranslation } from "react-i18next";
import { QueryProvider } from "@/providers/query-provider";

// Disable Reanimated strict mode warnings
// The warning "Reading from `value` during component render" is expected behavior
// when using useAnimatedStyle() and is not a bug
if (typeof global !== 'undefined') {
  try {
    // Suppress React Native Reanimated warnings about reading shared values during render
    const originalWarn = console.warn;
    const reanimatedWarningSuppressions = [
      'Reading from `value` during component render',
      '[Reanimated]',
    ];
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      const shouldSuppress = reanimatedWarningSuppressions.some(
        suppression => message.includes(suppression)
      );
      if (!shouldSuppress) {
        originalWarn(...args);
      }
    };
  } catch (e) {
    // Ignore errors during logger setup
  }
}

let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;

if (Platform.OS !== "web") {
  try {
    OneSignal = require("react-native-onesignal").OneSignal;
  } catch (error) {
    console.warn("OneSignal native module not found:", error);
    OneSignal = null;
  }
}
SplashScreen.preventAutoHideAsync();

export async function initOneSignal(): Promise<string | null> {
  if (!isOneSignalNativeAvailable() || !OneSignal) return null;

  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) throw new Error("Missing EXPO_PUBLIC_ONESIGNAL_APP_ID");

  OneSignal.initialize(appId);
  await OneSignal.Notifications.requestPermission(true);

  return await OneSignal.User.pushSubscription.getIdAsync();
}

export default function Layout() {
  useAuthListener();
  const { t: translate } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });
  const sessionToken = useAuthStore((s) => s.sessionToken);
  const isRestricted = useAuthStore((s) => s.isRestricted);
  const sessionExpiredNotice = useAuthStore((s) => s.sessionExpiredNotice);
  const setSessionExpiredNotice = useAuthStore((s) => s.setSessionExpiredNotice);
  const fetchStamps = useStamps((s) => s.fetchStamps);
  const fetchStreaks = useStreaks((s) => s.fetchStreaks);

  useEffect(() => {
    if (AppState.currentState === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    const restoreSessionAndRoute = async () => {
      SplashScreen.hideAsync();

      await initOneSignal();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const storedSessionToken = useAuthStore.getState().sessionToken;

      if (!session && !storedSessionToken) {
        if (Platform.OS === "web") {
          router.replace("/(onboarding)/landing");
        } else {
          const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
          if (!hasSeenOnboarding) {
            router.replace("/(onboarding)");
          } else {
            router.replace("/(onboarding)/welcome");
          }
        }
        return;
      }

      if (session) {
        try {
          const userId = session.user.id;

          fetchStamps();
          fetchStreaks();

          await checkIfAccountDeletedService(userId);
          await checkIfAccountBlockedService(userId);
          const nextRoute = getWebAdjustedHomeRoute(await getHomeRouteForUserId(userId));

          if (nextRoute === "/(store_manager)" || (typeof nextRoute === "string" && nextRoute.startsWith("/(store_manager)"))) {
            try {
              const sessionCheck = await checkDeviceSessionLimitService(userId);
              if (sessionCheck.allowed) {
                await upsertDeviceSessionService(userId);
              } else {
                markIntentionalSignOut();
                await supabase.auth.signOut();
                router.replace("/(auth)/login");
                return;
              }
            } catch (deviceErr) {
              console.warn("[DeviceSession] check failed during session restore:", deviceErr);
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
            console.error("Session restoration error:", err);
          }
        }
      }
    };

    restoreSessionAndRoute();
  }, [fontsLoaded, router, fetchStamps, fetchStreaks]);

  useEffect(() => {
    const checkUserStatusOnNav = async () => {
      const isPublicPage = pathname?.includes("(onboarding)") || pathname?.includes("(auth)");
      if (isRestricted || isPublicPage) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await checkIfAccountBlockedService(session.user.id);
        } catch (err) {
          if (err instanceof AccountBlockedError) {
            useAuthStore.getState().setRestricted(true);
          }
        }
      }
    };

    if (fontsLoaded) {
      checkUserStatusOnNav();
    }
  }, [pathname, isRestricted, fontsLoaded]);

  SplashScreen.setOptions({
    duration: 1000,
    fade: true,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <QueryProvider>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Slot />
      <Modal
        visible={isRestricted}
        onClose={() => {}}
        title="Account Restricted"
        message="Your account has been restricted. To verify your account status, please contact support."
        buttons={[
          {
            label: "OK",
            variant: "primary",
            onPress: async () => {
              const { setRestricted } = useAuthStore.getState();
              markIntentionalSignOut();
              await supabase.auth.signOut();
              await AsyncStorage.removeItem("sessionToken");
              setRestricted(false);
              router.replace("/(onboarding)/welcome");
            },
          },
        ]}
      />
      <Modal
        visible={sessionExpiredNotice}
        onClose={() => setSessionExpiredNotice(false)}
        title={translate("onboarding.sessionExpired.title")}
        message={translate("onboarding.sessionExpired.message")}
        showCloseButton={false}
        dismissOnBackdrop={false}
        timer={3000}
        buttons={[
          {
            label: translate("onboarding.sessionExpiredButton"),
            onPress: () => {
              setSessionExpiredNotice(false);
            },
            variant: "primary",
          },
        ]}
      />
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
