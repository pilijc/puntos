import "react-native-url-polyfill/auto";
import "react-native-gesture-handler";
import "../global.css";
import { Slot, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Animated, Easing, StatusBar, StyleSheet, View, Alert } from "react-native";
import { supabase } from "@/supabase/supabase";
import React from "react";
import { useAuthListener } from "@/hooks/auth-listener";
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Image } from "@/tw";
import { getHomeRouteForUserId } from "@/services/access-service";
import { checkIfAccountDeletedService, AccountDeletedError } from "@/services/auth-service";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";
import { useStamps } from "@/hooks/use-stamps";

SplashScreen.preventAutoHideAsync();

export async function initOneSignal() {
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) throw new Error("Missing EXPO_PUBLIC_ONESIGNAL_APP_ID");

  OneSignal.initialize(appId);
  OneSignal.Notifications.requestPermission(true);

  const subId = await OneSignal.User.pushSubscription.getIdAsync();
  return subId;
}

export default function Layout() {
  useAuthListener();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });
  const sessionToken = useAuthStore((s) => s.sessionToken);
  const fetchStamps = useStamps((s) => s.fetchStamps);

  useEffect(() => {
    const checkSession = async () => {
      await initOneSignal();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && !sessionToken) {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
          router.replace("/(onboarding)");
        } else {
          router.replace("/(onboarding)/welcome");
        }
        return;
      }

      if (session) {
        try {
          const userId = session.user.id;

          // Pre-fetch global state data
          fetchStamps();

          await checkIfAccountDeletedService(userId);
          const nextRoute = await getHomeRouteForUserId(userId);
          router.replace(nextRoute as any);
        } catch (err: any) {
          if (err instanceof AccountDeletedError) {
            Alert.alert("Login Failed", err.message);
            router.replace("/(auth)/login");
          } else {
            console.error("Session restoration error:", err);
          }
        }
      }
    };

    if (fontsLoaded) {
      checkSession();
    }
  }, [fontsLoaded, sessionToken]);




  SplashScreen.setOptions({
    duration: 1000,
    fade: true,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Slot />
    </GestureHandlerRootView>
  );
}
