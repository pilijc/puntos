import React, { useEffect } from "react";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import { AnimatedView, Link, SafeAreaView, Text, View, Image } from "@/tw";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth-store";


export default function Splash() {

  const { sessionChecked } = useAuthStore();

    useEffect(() => {
        const timer = setTimeout(() => {
        if (sessionChecked) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(onboarding)/welcome");
        }
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("../../assets/images/puntos-icon.png")}
          className="w-40 h-40"
        />
      </View>
    </SafeAreaView>
  );
}
