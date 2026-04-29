import React from "react";
import { View, Text } from "@/tw";

export const StatCard = ({ label, val, Icon }: { label: string, val: number | string, Icon: any }) => {
  const isDark = require('react-native').useColorScheme() === 'dark';
  return (
    <View
      className="flex-1 px-4 py-4 bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder"
    >
      <View className="items-center justify-center">
        <View className="flex-row items-center justify-center gap-x-2 mb-1">
          <Icon size={18} color="#FF6600" />
          <Text className="text-[20px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{val}</Text>
        </View>

        <View className="items-center">
          <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextSecondary uppercase tracking-wider">{label}</Text>
        </View>
      </View>
    </View>
  )
};