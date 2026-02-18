import "../global.css";
import { Slot, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { supabase } from "@/supabase/supabase";
import React from "react";
import { useAuthStore } from "@/store/auth-store";
import { useAuthListener } from "@/hooks/auth-listener";

SplashScreen.preventAutoHideAsync();

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