import React from "react";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import {RecentTransactionsProps} from "@/type/frontdesk/transaction";

export default function RecentTransactions({ recentScans }: RecentTransactionsProps) {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const ColorScheme = useColorScheme();
  const isDark = ColorScheme === "dark";

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (minutes < 1) return translate("frontdesk.transaction.recent.time.justNow");
    if (minutes < 60) return `${minutes}${translate(minutes === 1 ? "frontdesk.transaction.recent.time.minute" : "frontdesk.transaction.recent.time.minutes")} ago`;
    if (hours < 24) return `${hours}${translate(hours === 1 ? "frontdesk.transaction.recent.time.hour" : "frontdesk.transaction.recent.time.hours")} ago`;
    return `${days}${translate(days === 1 ? "frontdesk.transaction.recent.time.day" : "frontdesk.transaction.recent.time.days")} ago`;
  };

  return (
    <View className="px-4 pt-6 pb-8">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-1 h-5 bg-orange-500 rounded-full mr-3" />
          <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            {translate("frontdesk.transaction.recent.title")}
          </Text>
        </View>
        <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/history")}>
          <Text className="text-sm font-poppins-medium text-orange-500 mr-1">
            {translate("frontdesk.transaction.recent.view")}
          </Text>
          <MaterialIcons name="chevron-right" size={16} color="#FF6600" />
        </TouchableOpacity>
      </View>

      {recentScans.length > 0 ? (
        recentScans.slice(0, 5).map((scan, index) => (
          <View
            key={index}
            className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder mb-3 overflow-hidden"
          >
            <View className="flex-row items-center px-4 py-4">
              {/* Left accent bar */}
              <View className="w-1 h-10 bg-emerald-400 rounded-full mr-4" />
              <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl items-center justify-center mr-3">
                <MaterialIcons name="check" size={18} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                  ₱{scan.amount.toFixed(2)} {translate("frontdesk.transaction.recent.purchase")}
                </Text>
                <Text className="text-xs font-poppins text-neutral-400 dark:text-darkTextSoft mt-0.5">
                  {formatTimeAgo(scan.timestamp)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-poppins-bold text-orange-500">
                  +{scan.points}
                </Text>
                <Text className="text-xs font-poppins text-neutral-400">pts</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder px-6 py-10 items-center">
          <View className="w-14 h-14 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-2xl items-center justify-center mb-3">
            <MaterialIcons name="history" size={26} color={isDark ? "#4B5563" : "#D1D5DB"} />
          </View>
          <Text className="text-sm font-poppins-medium text-neutral-400 dark:text-darkTextSoft text-center">
            {translate("frontdesk.transaction.recent.empty")}
          </Text>
        </View>
      )}
    </View>
  );
}
