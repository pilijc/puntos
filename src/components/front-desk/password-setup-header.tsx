import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface PasswordSetupHeaderProps {
  isInitialSetup: boolean;
}

export default function PasswordSetupHeader({ isInitialSetup }: PasswordSetupHeaderProps) {
  return (
    <View className="items-center mb-8">
      <View className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-3xl items-center justify-center mb-4">
        <MaterialIcons name="lock" size={36} color="#FF6600" />
      </View>
      <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary text-center mb-2">
        {isInitialSetup ? "Set Your Password" : "Update Password"}
      </Text>
      <Text className="text-sm font-poppins text-neutral-500 dark:text-darkTextSecondary text-center px-4">
        {isInitialSetup 
          ? "Create a secure password for your frontdesk account"
          : "Enter your current password and choose a new one"
        }
      </Text>
    </View>
  );
}
