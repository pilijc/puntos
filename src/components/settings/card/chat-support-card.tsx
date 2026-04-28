import React from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export function ChatSupportCard() {
  const router = useRouter();
  const { t: translate } = useTranslation();

  return (
    <View className="bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden">
      <TouchableOpacity
        onPress={() => router.push("/(store_manager)/chat-support")}
        className="flex-row items-center"
        activeOpacity={0.7}
      >
        <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
          <MessageCircle size={15} color="#FF6600" />
        </View>

        <View className="flex-1 ml-2">
          <Text className="text-md font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
            Chat Support
          </Text>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            Get help from Super Admin
          </Text>
        </View>

        <ChevronRight size={15} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
