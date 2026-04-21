import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "@/tw";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SubscriptionCancelScreen() {
  const router = useRouter();
  const { t: translate } = useTranslation();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center px-6 bg-white dark:bg-neutral-900">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
          {translate("store_manager.subscription.cancel.title")}
        </Text>
        <Text className="mt-2 text-sm font-poppins text-textSecondary dark:text-darkTextSecondary text-center">
          {translate("store_manager.subscription.cancel.body")}
        </Text>

        <TouchableOpacity
          className="mt-6 px-5 py-3 rounded-xl bg-[#FF6600]"
          activeOpacity={0.85}
          onPress={() => router.replace("/(store_manager)/subscription")}
        >
          <Text className="text-sm font-poppins-semibold text-white">
            {translate("store_manager.subscription.cancel.back")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

