import React, { useEffect } from "react";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import { AnimatedView, Link, SafeAreaView, Text, View, Image } from "@/tw";
// import { auth, db } from "@/supabase/supabase";
import { router } from "expo-router";


export default function Splash() {

    useEffect(() => {
        const timer = setTimeout(() => {
        router.replace("/welcome"); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  const testFirestore = async () => {
 
};

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("../assets/images/puntos-icon.png")}
          className="w-40 h-40"
        />
      </View>
    </SafeAreaView>
  );
}
