import React from "react";
import { Platform } from "react-native";
import { Redirect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, SafeAreaView, Image } from "@/tw";
import { Button } from "@/components/button";
import { supabase } from "@/supabase/supabase";
import { markIntentionalSignOut } from "@/lib/intentional-signout";

export default function WebUnavailable() {
  const router = useRouter();

  if (Platform.OS !== "web") {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  const handleSignOut = async () => {
    markIntentionalSignOut();
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("sessionToken");
    router.replace("/(onboarding)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-darkBackground">
      <View className="flex-1 px-4 py-8 justify-center items-center">
        <View className="w-full max-w-md rounded-2xl border border-slate-100 dark:border-darkBorder bg-white dark:bg-darkBackground px-6 py-8 shadow-sm">
          <View className="items-center gap-5">
            <Image
              source={require("../assets/images/found.png")}
              className="w-36 h-36"
              resizeMode="contain"
              accessibilityLabel="Illustration for web availability"
            />
            <View className="gap-2">
              <Text className="text-xl font-poppins-bold text-center text-textPrimary dark:text-darkTextPrimary">
                Web is for store teams
              </Text>
              <Text className="text-sm font-poppins text-center text-textMuted dark:text-darkTextSecondary leading-6">
                Customer and front-desk features live in the Puntos mobile app. If you meant to use those, open the app on your phone.
              </Text>
              <Text className="text-sm font-poppins text-center text-textMuted dark:text-darkTextSecondary leading-6">
                Store managers and super admins can keep using this site. Signed in with the wrong type of account? Sign out and try again.
              </Text>
            </View>
            <View className="w-full pt-2">
              <Button label="Sign out" onPress={handleSignOut} variant="primary" fullWidth />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
