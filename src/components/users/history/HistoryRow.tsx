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
      className={`active:scale-[0.98] transition-transform duration-150 ${isPositive ? "px-4 py-3" : "p-4"}`}
      onPress={handlePress}
      disabled={!storeId}
    >
      {isPositive ? (
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-poppins-semibold">
              {translate(displayTitle)}
            </Text>
            <Text className="text-sm font-poppins text-neutral-500 dark:text-neutral-400">
              {translate(subtitle)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-poppins-bold text-emerald-700 dark:text-emerald-300 flex-1">
              {points}
            </Text>
            {timeStr && (
              <Text className="text-sm font-poppins text-neutral-400 dark:text-neutral-500 mt-1">
                {timeStr}
              </Text>
            )}
          </View>
        </View>
      ) : (
        // Original layout with icon for redeem rows
        <View className="flex-row items-center">
          {/* Modern Icon Container */}

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                numberOfLines={1}
                className="text-base font-poppins-semibold  flex-1 -mt-6"
              >
                {translate(displayTitle)}
              </Text>
              <View className="items-end">
                <View className="">
                  <Text className="text-base font-poppins-bold text-orange-700 dark:text-orange-300">
                    {points}
                  </Text>
                </View>
                {timeStr && (
                  <Text className="text-sm font-poppins text-neutral-400 dark:text-neutral-500 mt-1">
                    {timeStr}
                  </Text>
                )}
              </View>
            </View>
            <Text className="text-sm font-poppins text-neutral-500 dark:text-neutral-400 -mt-6">
              {translate(subtitle)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
