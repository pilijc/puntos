import { Text, SafeAreaView, View } from "@/tw";
import React from "react";

export default function Discover() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
          Discover
        </Text>
        <Text className="text-base font-poppins mb-4 text-neutral-700">
          Welcome to Puntos! Here you can:
        </Text>
        <Text className="text-base font-poppins mb-2 text-neutral-700">
          • Explore new challenges and earn points.
        </Text>
        <Text className="text-base font-poppins mb-2 text-neutral-700">
          • Check the store for cool rewards.
        </Text>
        <Text className="text-base font-poppins mb-2 text-neutral-700">
          • Track your progress and history.
        </Text>
        <Text className="text-base font-poppins mb-2 text-neutral-700">
          • Personalize your experience in settings.
        </Text>
        <Text className="text-base font-poppins mt-4 text-neutral-600">
          Get started by tapping a tab below!
        </Text>
      </View>
    </SafeAreaView>
  );
}
