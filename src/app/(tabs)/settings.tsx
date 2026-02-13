import { supabase } from "@/supabase/supabase";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";

export default function Settings() {

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(onboarding)/welcome");
    } catch (error) {
      Alert.alert("Logout error", error.message);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
          Settings
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-primary py-4 rounded-xl items-center"
      >
        <Text className="text-white text-base font-poppins-semibold">
          Logout
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
