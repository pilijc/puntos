import React from "react";
import { Platform } from "react-native";
import { Redirect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, SafeAreaView } from "@/tw";
import { Button } from "@/components/button";
import { supabase } from "@/supabase/supabase";

export default function WebUnavailable() {
  const router = useRouter();

  if (Platform.OS !== "web") {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("sessionToken");
    router.replace("/(onboarding)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center gap-4">
        <Text className="text-xl font-poppins-bold text-center text-textPrimary dark:text-slate-100">
          Web is for staff only
        </Text>
        <Text className="text-sm font-poppins text-textMuted dark:text-slate-400 text-center leading-6">
          Use the mobile app for customer and front desk accounts. Sign in on web as a store manager or super admin.
        </Text>
        <Button label="Sign out" onPress={handleSignOut} variant="primary" fullWidth />
      </View>
    </SafeAreaView>
  );
}
