import React from "react";
import { Text, View, TouchableOpacity } from "@/tw";
import { TrendingUp, Gift } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const TABS = ["all", "earned", "claimed"];

interface HistoryHeaderProps {
  totalEarned: number;
  totalSpent: number;
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function HistoryHeader({
  totalEarned,
  totalSpent,
  activeTab,
  onTabChange
}: HistoryHeaderProps) {
  const { t: translate } = useTranslation();

  return (
    <View className="space-y-4">
      {/* ── Modern Header ── */}
      <View className="pt-4 pb-2">
        <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
          {translate("user.activity.title")}
        </Text>
        <Text className="text-sm font-poppins text-neutral-500 dark:text-neutral-400 mt-1">
          Track your points activity
        </Text>
      </View>

      {/* ── Modern Summary Cards ── */}
      <View className="flex-row gap-3">
        {/* Earned Card */}
        <View className="flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/20 dark:to-emerald-600/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-500/30">
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-10 h-10 rounded-full bg-emerald-500 dark:bg-emerald-400 items-center justify-center">
              <TrendingUp size={20} color="white" />
            </View>
            <View className="bg-emerald-500/20 dark:bg-emerald-400/20 px-2 py-1 rounded-full">
              <Text className="text-xs font-poppins-semibold text-emerald-700 dark:text-emerald-300">
                +{totalEarned.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-poppins-semibold text-emerald-900 dark:text-emerald-100">
            Points Earned
          </Text>
          <Text className="text-xs font-poppins text-emerald-600 dark:text-emerald-400 mt-1">
            From purchases & vouchers
          </Text>
        </View>

        {/* Spent Card */}
        <View className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/20 dark:to-orange-600/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-500/30">
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-10 h-10 rounded-full bg-orange-500 dark:bg-orange-400 items-center justify-center">
              <Gift size={20} color="white" />
            </View>
            <View className="bg-orange-500/20 dark:bg-orange-400/20 px-2 py-1 rounded-full">
              <Text className="text-xs font-poppins-semibold text-orange-700 dark:text-orange-300">
                {totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-poppins-semibold text-orange-900 dark:text-orange-100">
            Points Spent
          </Text>
          <Text className="text-xs font-poppins text-orange-600 dark:text-orange-400 mt-1">
            On rewards & redemptions
          </Text>
        </View>
      </View>

      {/* ── Modern Filter Pills ── */}
      <View className="flex-row gap-2 pt-3 pb-3 pl-2">
        {TABS.map((tab, i) => {
          const isActive = activeTab === i;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(i)}
              className={`px-3 py-1 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-primary scale-[1.05]"
                  : "bg-white dark:bg-darkBackgroundCard border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              <Text
                className={`text-sm font-poppins-semibold ${
                  isActive 
                    ? "text-white" 
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {translate(`user.activity.filter.${tab}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
