import React from "react";
import { View, Text } from "@/tw";

export const StatCard = ({ label, val, Icon }: { label: string, val: number | string, Icon: any }) => {
  const isDark = require('react-native').useColorScheme() === 'dark';
  return (
  <View
    className="flex-1 px-4 py-3 bg-white dark:bg-darkBackgroundMuted rounded-[16px] border border-slate-100 dark:border-darkBorder"
  >
    <View className="flex-1 justify-between">
      <View className="flex-row items-center justify-center gap-x-2">
        <Icon size={16} color={isDark ? "#FFFFFF" : "#0F172A"} />
        <Text className="text-[20px] font-poppins-bold text-primary">{val}</Text>
      </View>

      <View className="items-center">
        <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextSecondary">{label}</Text>
      </View>
    </View>
  </View>
)};