import { View, Text, Pressable, Image } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import type { RewardItem } from "@/data/rewards";

type RewardCardProps = {
  reward: RewardItem;
  storeName?: string;
  storeLocation?: string;
  onPress?: () => void;
};

export default function RewardCard({
  reward,
  storeName,
  storeLocation,
  onPress,
}: RewardCardProps) {
  const isRedeemable = reward.status === "redeem";
  const badgeClass = isRedeemable ? "bg-primary/10" : "bg-neutral-200";
  const badgeTextClass = isRedeemable ? "text-primary" : "text-neutral-400";

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-3 flex-row gap-x-3"
    >
      <View className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden">
        {reward.imageUrl ? (
          <Image
            source={reward.imageUrl}
            className="w-full h-full"
            contentFit="cover"
            contentPosition="center"
          />
        ) : (
          <Text className="text-[10px] text-neutral-400 font-poppins">IMAGE</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
          {reward.title}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-darkTextSecondary font-poppins mt-1">
          {reward.desc}
        </Text>
        {storeName ? (
          <View className="flex-row items-center gap-x-1 mt-2">
            <MaterialIcons name="storefront" size={12} color="#94a3b8" />
            <Text className="text-[11px] text-neutral-400 font-poppins-medium">
              {storeName}
              {storeLocation ? ` • ${storeLocation}` : ""}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-primary font-poppins-semibold">
            {reward.points.toLocaleString()} pts
          </Text>
          <View className={`px-3 py-1 rounded-full ${badgeClass}`}>
            <Text
              className={`text-[10px] font-poppins-semibold ${badgeTextClass}`}
            >
              {isRedeemable ? "REDEEM" : "INSUFFICIENT"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

