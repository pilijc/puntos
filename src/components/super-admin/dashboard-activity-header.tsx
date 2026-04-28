import React from "react";
import { Text, View } from "@/tw";
import { useTranslation } from "react-i18next";

interface DashboardActivityHeaderProps {
  weekRange: string;
}

export function DashboardActivityHeader({ weekRange }: DashboardActivityHeaderProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="pt-6 pb-2 flex-row justify-between items-start" style={{ paddingHorizontal: "4%" }}>
      <View>
        <Text className="text-base font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
          {translate("superAdmin.dashboard.platformActivity")}
        </Text>
        <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-darkTextMuted mt-0.5">
          {weekRange}
        </Text>
      </View>
      <View style={{ flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
          <Text className="text-[8px] font-poppins-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {translate("superAdmin.dashboard.usersLegend")}
          </Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
          <Text className="text-[8px] font-poppins-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {translate("superAdmin.dashboard.storesLegend")}
          </Text>
        </View>
      </View>
    </View>
  );
}
