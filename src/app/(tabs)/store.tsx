import { View, Text, SafeAreaView } from "@/tw";
import React from "react";

export default function Store() {
  return <SafeAreaView className="flex-1 bg-background">
    <View className="px-6 pt-6">
      <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
        Store
      </Text>
    </View>
  </SafeAreaView>;
}
