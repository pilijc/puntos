import React from "react";
import { Text, View, TouchableOpacity, Image } from "@/tw";
import { CirclePlus, Gift, Coins } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface HistoryRowProps {
  title: string;
  subtitle: string;
  time: string;
  points: string;
  positive?: boolean;
  image?: string;
  icon?: string;
  storeName?: string;
  storeId?: string;
  onPress?: (storeId: string) => void;
}

export default function HistoryRow({
  title,
  subtitle,
  time,
  points,
  positive,
  image,
  icon,
  storeName,
  storeId,
  onPress
}: HistoryRowProps) {
  const { t: translate, i18n } = useTranslation();
  const isPositive = positive ?? points?.startsWith("+");
  const displayTitle = title || storeName || 'user.activity.unknownStore';

  const timeStr = time
    ? new Date(time).toLocaleTimeString(
      i18n.language === "ja" ? "ja-JP" : "en-US",
      { hour: "numeric", minute: "2-digit", hour12: true }
    )
    : null;

  const handlePress = () => {
    if (onPress && storeId) {
      onPress(storeId);
    }
  };

  return (
    <TouchableOpacity 
      className="bg-white dark:bg-darkBackgroundCard rounded-2xl p-4 mb-3 border border-neutral-100 dark:border-neutral-800 active:scale-[0.98] transition-transform duration-150"
      onPress={handlePress}
      disabled={!storeId}
    >
      <View className="flex-row items-center">
        {/* Modern Icon Container */}
        <View className="relative">
          <View
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
              isPositive 
                ? "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-500/20 dark:to-emerald-600/20" 
                : "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-600/20"
            }`}
          >
            {icon ? (
              <Text className={`text-lg ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                {icon}
              </Text>
            ) : image ? (
              <Image source={{ uri: image }} className="w-12 h-12 rounded-2xl" />
            ) : (
              isPositive ? (
                <Coins size={20} color="#10b981" />
              ) : (
                <Gift size={20} color="#FF6600" />
              )
            )}
          </View>
          {/* Activity indicator dot */}
          <View className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            isPositive ? "bg-emerald-500" : "bg-orange-500"
          }`} />
        </View>

        {/* Content */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              numberOfLines={1}
              className="text-base font-poppins-semibold text-neutral-900 dark:text-white flex-1"
            >
              {translate(displayTitle)}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${
                isPositive 
                  ? "bg-emerald-100 dark:bg-emerald-500/20" 
                  : "bg-orange-100 dark:bg-orange-500/20"
              }`}
            >
              <Text
                className={`text-sm font-poppins-bold ${
                  isPositive ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300"
                }`}
              >
                {points}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-poppins text-neutral-500 dark:text-neutral-400">
            {translate(subtitle)}
          </Text>
          {timeStr && (
            <Text className="text-xs font-poppins text-neutral-400 dark:text-neutral-500 mt-1">
              {timeStr}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
