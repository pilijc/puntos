import "../global.css";
import { Slot, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Animated, Easing, StatusBar, StyleSheet, View, Alert } from "react-native";
import { supabase } from "@/supabase/supabase";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthListener } from "@/hooks/auth-listener";
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Image } from "@/tw";
import { getHomeRouteForUserId } from "@/services/access-service";
import { checkIfAccountDeletedService } from "@/services/auth-service";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/auth-store";

SplashScreen.preventAutoHideAsync();

function SplashPulse() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <Animated.View style={animatedStyle}>
        <Image
          source={require("../assets/images/puntos-icon.png")}
          className="w-10 h-10"
        />
      </Animated.View>
    </View>
  );
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !sessionToken) {
        router.replace("/(onboarding)/welcome");
      } else {
        try {
          await checkIfAccountDeletedService(session.user.id);

          const nextRoute = await getHomeRouteForUserId(session.user.id);
          router.replace(nextRoute);
        } catch (err: any) {
          if (err.message === "Invalid login credentials.") {
            Alert.alert("Login Failed", "Invalid login credentials.");
            router.replace("/(auth)/login");
          }
        }
      }

      const nextRoute = await getHomeRouteForUserId(session.user.id);
      router.replace(nextRoute);
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
