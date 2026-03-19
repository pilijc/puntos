import React from "react";
import { View, Text, AnimatedView, TouchableOpacity, Image } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Layout } from "react-native-reanimated";
import { storeLogos } from "@/data/rewards";
import { useTranslation } from "react-i18next";

interface UserStreakCardProps {
  streak: any;
  nearbyStores: any[];
  isStoreNearby: (lat?: number | null, lon?: number | null) => boolean;
}

export default function UserStreakCard({
  streak,
  nearbyStores,
  isStoreNearby,
}: UserStreakCardProps) {
  const { t: translate } = useTranslation();
  const storeStr = streak.stores as any;
  const storeName = storeStr?.name ?? translate("rewards.store");
  const storeAddress = storeStr?.address ?? translate("rewards.unknownLocation");
  const nearby =
    nearbyStores.some((s) => Number(s.id) === Number(streak.store_id)) ||
    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

  // Mocking streak progress for UI: use 3 days completed for now
  const clampedCount = 3;
  const targetCount = 7;
  const streakDays = [
    translate("rewards.days.mon"),
    translate("rewards.days.tue"),
    translate("rewards.days.wed"),
    translate("rewards.days.thu"),
    translate("rewards.days.fri"),
    translate("rewards.days.sat"),
    translate("rewards.days.sun")
  ];

  const days = streakDays.map((label, index) => ({
    label: label,
    state:
      index < clampedCount
        ? "completed"
        : index === clampedCount
          ? "current"
          : "upcoming",
  }));

  const getLogoImage = (store: any) => {
    if (store.logo) {
      return { uri: store.logo };
    }
    if (store.id && storeLogos[store.id.toString()]) {
      return storeLogos[store.id.toString()];
    }
    return require("../../assets/images/rewards/coffee-shop.png");
  };

  return (
    <AnimatedView
      layout={Layout.duration(300)}
      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden mx-1"
    >
      <View className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <MaterialIcons
              name="local-fire-department"
              size={18}
              color="#FF6600"
            />
            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
              {translate("rewards.streakLog")}
            </Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            {nearby && (
              <View className="bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-x-1">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <Text className="text-[10px] font-poppins-semibold text-green-700 dark:text-green-400">
                  {translate("rewards.nearby")}
                </Text>
              </View>
            )}
            <TouchableOpacity disabled={true} className="px-2 py-1 opacity-50">
              <View className="flex-row items-center gap-x-1">
                <Text className="text-primary text-xs font-poppins-semibold">
                  {translate("rewards.viewAll")}
                </Text>
                <MaterialIcons name="open-in-new" size={12} color="#FF6600" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-x-3 mt-1.5">
          <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
            {storeStr?.logo || storeLogos[streak.store_id.toString()] ? (
              <Image
                source={getLogoImage({ ...storeStr, id: streak.store_id })}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <MaterialIcons name="storefront" size={20} color="#FF6600" />
            )}
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-1 flex-wrap flex-1">
              <Text
                className="font-poppins-semibold text-neutral-900 dark:text-neutral-100"
                numberOfLines={1}
              >
                {storeName}
              </Text>
              <Text
                className="text-[10px] text-neutral-500 dark:text-neutral-400 font-poppins"
                numberOfLines={1}
              >
                • {storeAddress}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-[10px] font-poppins-medium text-neutral-400 mt-1">
          {translate("rewards.daysThisWeek", { current: clampedCount, target: targetCount })}
        </Text>

        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2 px-1">
          {days.map((day, index) => {
            const isCompleted = day.state === "completed";
            const isCurrent = day.state === "current";
            const circleClass = isCompleted
              ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
              : isCurrent
                ? "w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted"
                : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center";
            const textClass =
              isCompleted || isCurrent
                ? "text-primary font-poppins-semibold text-[10px]"
                : "text-neutral-400 font-poppins-semibold text-[10px]";
            return (
              <View
                key={`${day.label}-${index}`}
                className="items-center w-11"
              >
                <View
                  className={circleClass}
                  style={
                    isCurrent
                      ? {
                        borderWidth: 1.5,
                        borderColor: "#FF6600",
                        borderStyle: "dashed",
                      }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <View className="items-center justify-center">
                      <MaterialIcons
                        name="check"
                        size={12}
                        color="#FFFFFF"
                        className="mb-0.5"
                      />
                      <Text className="text-white font-poppins-bold text-[8px] uppercase">
                        {day.label}
                      </Text>
                    </View>
                  ) : (
                    <Text className={textClass}>{day.label}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </AnimatedView>
  );
}
