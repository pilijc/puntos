import React from "react";
import { View, Text } from "@/tw";
import { StatusBadgeProps, StreakStatus } from "@/type/store-manager/streak";

export function StatusBadge({ status }: { status: StreakStatus }) {
  const config = StatusBadgeProps[status];

  return (
    <View className={`flex-row items-center gap-x-1 ${config.color} px-2.5 py-1 rounded-full`}>
      <View className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Text className={`text-[10px] font-poppins-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}
