import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import {FrontDeskHeaderProps} from "@/type/frontdesk/header";

export default function FrontDeskHeader({ storeInfo }: FrontDeskHeaderProps) {
  const { t: translate } = useTranslation();

  return (
    <View className="bg-white dark:bg-darkBackgroundCard px-5 pt-16 pb-5 border-b border-neutral-100 dark:border-darkBorder">
      <View className="flex-row items-center justify-between mb-5">
        <View>
          <Text className="text-xs font-poppins-medium text-neutral-400 dark:text-darkTextSoft uppercase tracking-widest mb-1">
            Front Desk
          </Text>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            {translate("frontdesk.transaction.title")}
          </Text>
        </View>
      </View>

      {/* Store Chip */}
      {storeInfo && (
        <View className="flex-row items-center px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-darkBorder">
          <View className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-lg items-center justify-center mr-3">
            <MaterialIcons name="store" size={16} color="#FF6600" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-poppins-semibold text-primary uppercase tracking-wide">
              {translate("frontdesk.transaction.store")}
            </Text>
            <Text className="text-sm font-poppins-bold text-neutral-700 dark:text-darkTextSoft">
              {storeInfo.name}
            </Text>
          </View>
          <View className="w-2 h-2 bg-emerald-400 rounded-full" />
        </View>
      )}
    </View>
  );
}
