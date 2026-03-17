import React, { useState } from "react";
import { View, Text, AnimatedView, TouchableOpacity, Image, Pressable } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FadeIn, FadeOut, Layout, useAnimatedStyle, withTiming, interpolate } from "react-native-reanimated";
import { storeLogos } from "@/data/rewards";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface UserStampLogCardProps {
  stamp: any;
  nearbyStores: any[];
  isStoreNearby: (lat?: number | null, lon?: number | null) => boolean;
  stampRewards: any[];
  activeStampProgramRewards: any[];
  isStampLogOpen: boolean;
  onToggleExpand: () => void;
}

export default function UserStampLogCard({
  stamp,
  nearbyStores,
  isStoreNearby,
  stampRewards,
  activeStampProgramRewards,
  isStampLogOpen,
  onToggleExpand,
}: UserStampLogCardProps) {
  const { t: translate } = useTranslation();

  const stampReward = stampRewards.find((s) => s.store_id === stamp.store_id);
  const activeProgramReward = activeStampProgramRewards.find(
    (program) => program.store_id === Number(stamp.store_id),
  );

  const count = stamp.stamps_count ?? stampReward?.current_stamp_count ?? 0;
  const targetCount = Math.max(
    activeProgramReward?.total_stamps ?? stampReward?.target_stamps ?? stamp.target ?? 7,
    1,
  );
  const clampedCount = Math.min(Math.max(count, 0), targetCount);

  // Compute Nearby Status
  const storeStr = stamp.stores as unknown as { latitude?: number; longitude?: number; name?: string; is_active?: boolean; logo?: string; banner?: string; address?: string };
  const storeName = storeStr?.name ?? translate("rewards.store");
  const storeAddress = storeStr?.address ?? translate("rewards.unknownLocation");
  const nearby = nearbyStores.some((s) => Number(s.id) === Number(stamp.store_id)) ||
    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

  const days = Array.from({ length: targetCount }, (_, index) => ({
    label: `Log ${index + 1}`,
    number: index + 1,
    state:
      index < clampedCount
        ? "completed"
        : index === clampedCount && clampedCount < targetCount
          ? "current"
          : "upcoming",
  }));

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isStampLogOpen ? "180deg" : "0deg", {
            duration: 250,
          }) as unknown as string, // Cast to string to satisfy type checker, though the actual value works
        },
      ],
    };
  });

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
      <Pressable
        onPress={onToggleExpand}
        className="p-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <MaterialIcons name="stars" size={18} color="#FF6600" />
            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
              {translate("rewards.stampLog")}
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
            <AnimatedView style={chevronStyle}>
              <MaterialIcons
                name="expand-more"
                size={22}
                color="#FF6600"
              />
            </AnimatedView>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push("/store/streaks");
              }}
              className="px-2 py-1"
            >
              <Text className="text-primary text-xs font-poppins-semibold">
                {translate("rewards.viewAll")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-x-3 mt-1.5">
          <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
            {storeStr?.logo || storeLogos[stamp.store_id.toString()] ? (
              <Image
                source={getLogoImage({ ...storeStr, id: stamp.store_id })}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <MaterialIcons name="storefront" size={20} color="#FF6600" />
            )}
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-1 flex-wrap flex-1">
              <Text className="font-poppins-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                {storeName}
              </Text>
              <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 font-poppins" numberOfLines={1}>
                • {storeAddress}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-[10px] font-poppins-medium text-neutral-400 mt-1">
          {translate("rewards.completed", { current: clampedCount, target: targetCount })}
        </Text>

        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2">
          {days.map((day, index) => {
            const isCompleted = day.state === "completed";
            const isCurrent = day.state === "current";
            const circleClass = isCompleted
              ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
              : isCurrent
                ? "w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted"
                : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center";
            const textClass = isCompleted || isCurrent
              ? "text-primary font-poppins-semibold text-sm"
              : "text-neutral-400 font-poppins-semibold text-sm";
            return (
              <View key={`${day.label}-${index}`} className="items-center w-11">
                <View
                  className={circleClass}
                  style={isCurrent ? {
                    borderWidth: 1.5,
                    borderColor: "#FF6600",
                    borderStyle: "dashed",
                  } : undefined}
                >
                  {isCompleted ? (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  ) : (
                    <Text className={textClass}>{day.number}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

      </Pressable>

      {isStampLogOpen && (
        <AnimatedView
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.duration(250)}
          className="px-3 pb-3 pt-1 border-t border-neutral-50 dark:border-darkBorder bg-neutral-50/10"
        >
          <View className="flex-row items-center justify-between border border-primary/10 bg-primary/5 dark:bg-primary/10 rounded-2xl p-3">
            <View className="flex-row items-center gap-x-3 flex-1">
              <View className="relative">
                <View className="w-14 h-14 rounded-2xl bg-white dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-primary/5">
                  <MaterialIcons name="monetization-on" size={28} color="#FF6600" />
                </View>
                {clampedCount >= targetCount && (
                  <View className="absolute -top-1.5 -right-1.5 bg-green-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-darkBackgroundMuted">
                    <MaterialIcons name="check" size={12} color="white" />
                  </View>
                )}
              </View>
              <View className="flex-1 ml-0.5">
                <Text className="text-[10px] font-poppins-bold text-primary uppercase tracking-[1.2px] mb-0.5">
                  {clampedCount >= targetCount ? translate("rewards.unlocked") : translate("rewards.reward")}
                </Text>
                <Text
                  className="text-sm text-neutral-800 dark:text-neutral-100 font-poppins-bold"
                  numberOfLines={1}
                >
                  {activeProgramReward?.reward_title ?? translate("index.rewardPlaceholder.title")}
                </Text>
                <Text className="text-[10px] text-neutral-400 font-poppins mt-0.5" numberOfLines={1}>
                  {clampedCount >= targetCount
                    ? translate("rewards.claimPointsNow")
                    : translate("rewards.stampsMoreToUnlock", { count: targetCount - clampedCount })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`px-4 py-2.5 rounded-xl ${clampedCount >= targetCount ? "bg-primary" : "bg-white dark:bg-darkBackgroundCard opacity-60"}`}
              disabled={clampedCount < targetCount}
              onPress={() => {
                Alert.alert(
                  translate("rewards.messages.notice"),
                  translate("rewards.messages.claimConfirm", { rewardTitle: activeProgramReward?.reward_title ?? translate("rewards.points") }),
                  [
                    { text: translate("label.cancel"), style: "cancel" },
                    { text: translate("rewards.claim"), onPress: () => Alert.alert(translate("rewards.messages.success"), translate("rewards.messages.claimSuccess")) }
                  ]
                );
              }}
            >
              <Text className={`text-[11px] font-poppins-bold tracking-wider ${clampedCount >= targetCount ? "text-white" : "text-neutral-400"}`}>
                {translate("rewards.claim")}
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
      )}
    </AnimatedView>
  );
}
