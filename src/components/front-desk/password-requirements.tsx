import React from "react";
import { View, Text } from "@/tw";

export default function PasswordRequirements() {
  return (
    <View className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 border border-orange-100 dark:border-orange-500/20">
      <Text className="text-sm font-poppins-semibold text-orange-600 dark:text-orange-400 mb-2">
        Password Requirements:
      </Text>
      <View className="space-y-1">
        <Text className="text-xs font-poppins text-orange-500 dark:text-orange-300">
          • At least 8 characters long
        </Text>
        <Text className="text-xs font-poppins text-orange-500 dark:text-orange-300">
          • Contains uppercase letter (A-Z)
        </Text>
        <Text className="text-xs font-poppins text-orange-500 dark:text-orange-300">
          • Contains lowercase letter (a-z)
        </Text>
        <Text className="text-xs font-poppins text-orange-500 dark:text-orange-300">
          • Contains numbers (0-9)
        </Text>
      </View>
    </View>
  );
}
