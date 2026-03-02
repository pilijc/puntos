import React, { useEffect } from "react";
import { SafeAreaView, View, Image } from "@/tw";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getHomeRouteForUserId } from "@/services/access-service";

export default function Splash() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/(onboarding)");
        return;
      }

      const nextRoute = await getHomeRouteForUserId(session.user.id);
      router.replace(nextRoute);
    }, 1200);

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
