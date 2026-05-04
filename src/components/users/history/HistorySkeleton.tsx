import React from "react";
import { Text, View } from "@/tw";
import { ReceiptText } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function HistorySkeleton() {
  const { t: translate } = useTranslation();

  return (
    <View className="gap-y-5">
      {/* Summary card skeleton */}
      <View className="flex-row gap-3">
        {[0, 1].map((i) => (
          <View key={i} className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
              <View className="h-5 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            </View>
            <View className="h-4 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-2" />
            <View className="h-3 w-24 rounded-full bg-neutral-50 dark:bg-neutral-900" />
          </View>
        ))}
      </View>

      {/* Filter pills skeleton */}
      <View className="flex-row gap-2">
        {[0, 1, 2].map((i) => (
          <View key={i} className="h-8 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </View>

      {/* Transaction skeleton */}
      {[0, 1].map((group) => (
        <View key={group} className="space-y-3">
          <View className="h-3 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-2" />
          {[...Array(2)].map((_, i) => (
            <View key={i} className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mr-4" />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="h-4 w-3/4 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                    <View className="h-5 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                  </View>
                  <View className="h-3 w-1/2 rounded-full bg-neutral-50 dark:bg-neutral-900" />
                  <View className="h-3 w-16 rounded-full bg-neutral-50 dark:bg-neutral-900 mt-1" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function HistoryEmptyState() {
  const { t: translate } = useTranslation();

  return (
    <View className="items-center justify-center py-20">
      <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center mb-6">
        <ReceiptText size={44} color="#CBD5E1" />
      </View>
      <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white text-center">
        {translate("user.activity.empty")}
      </Text>
      <Text className="text-sm font-poppins text-neutral-400 text-center mt-2 px-10">
        {translate("user.activity.loading")}
      </Text>
    </View>
  );
}
