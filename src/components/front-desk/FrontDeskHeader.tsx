import React from "react";
import { View, Text } from "@/tw";
import { Store, Sun,Moon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {FrontDeskHeaderProps} from "@/type/frontdesk/header";

export default function FrontDeskHeader({ storeInfo }: FrontDeskHeaderProps) {
  const { t: translate } = useTranslation();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning!", icon: Sun, color: "#F59E0B" };
    if (hour < 17) return { text: "Good afternoon!", icon: Sun, color: "#FF6600" };
    return { text: "Good evening!", icon: Moon, color: "#6366F1" };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <View className="bg-white dark:bg-darkBackgroundCard px-5 pt-16 pb-5 border-b border-neutral-100 dark:border-darkBorder">
      {/* Welcome Section */}
      <View className="flex-row items-start justify-between mb-5">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <GreetingIcon size={16} color={greeting.color} style={{ marginRight: 6 }} />
            <Text className="text-sm font-poppins-semibold" style={{ color: greeting.color }}>
              {greeting.text}
            </Text>
          </View>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            {translate("frontdesk.transaction.title")}
          </Text>
          <Text className="text-xs font-poppins text-neutral-500 dark:text-darkTextSoft mt-1">
            Process customer transactions quickly
          </Text>
        </View>
      </View>

      {/* Store Info Card */}
      {storeInfo && (
        <View className="bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/10 p-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white dark:bg-darkBackgroundCard rounded-xl items-center justify-center mr-4 shadow-sm">
              <Store size={20} color="#FF6600" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-poppins-medium text-neutral-500 dark:text-darkTextSoft mb-0.5">
                Working at
              </Text>
              <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                {storeInfo.name}
              </Text>
            </View>
            <View className="bg-white dark:bg-darkBackgroundCard px-3 py-1.5 rounded-full shadow-sm">
              <Text className="text-xs font-poppins-semibold text-orange-500">
                Active
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
