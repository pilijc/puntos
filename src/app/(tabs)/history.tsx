import { Text, ScrollView, SafeAreaView, View } from "@/tw";
import React from "react";

export default function History() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-6">
      <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
        History
      </Text>
      </View>
    </SafeAreaView>
  );
}