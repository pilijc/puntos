import "../global.css";
import { router, Slot, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { Text, View, Image, Link } from "@/tw";
import { useEffect } from "react";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../app/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../app/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../app/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../app/assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(onboarding)/welcome");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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