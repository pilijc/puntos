import "../global.css";
import { Slot, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Animated, Easing, StatusBar, StyleSheet, View } from "react-native";
import { supabase } from "@/supabase/supabase";
import React from "react";
import { useAuthListener } from "@/hooks/auth-listener";
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Image } from "@/tw";

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
          className="w-40 h-40"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export default function Layout() {
  useAuthListener();
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.replace("/(onboarding)/welcome");
      } else {
        router.replace("/(tabs)");
      }
      setSessionChecked(true);
    };

    if (fontsLoaded) {
      checkSession();
    }
  }, [fontsLoaded]);

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
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Slot />
    </>
  );
}