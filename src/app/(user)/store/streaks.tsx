import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { View as RNView } from "react-native";
import { router } from "expo-router";
import { useStamps } from "@/hooks/use-stamps";
import { useTranslation } from "react-i18next";

export default function StoreStreaks() {
  const { t: translate } = useTranslation();
  const { stamps, isLoading } = useStamps();

  const activeStamps = stamps.length;
  // Guard against spread on empty array
  const highestStampCount = activeStamps > 0
    ? Math.max(...stamps.map((s) => s.stamps_count))
    : 0;

  const getTier = (completed: number) => {
    if (completed >= 5) return { label: translate("rewards.streaks.tiers.gold"), color: "text-amber-500" };
    if (completed >= 3) return { label: translate("rewards.streaks.tiers.silver"), color: "text-slate-400" };
    return { label: translate("rewards.streaks.tiers.bronze"), color: "text-amber-700" };
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-10 gap-y-5"
      >
        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder items-center justify-center"
          >
            <MaterialIcons name="chevron-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
            {translate("rewards.streaks.title")}
          </Text>
        </View>

        <View className="bg-primary rounded-3xl p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-xs font-poppins">
                {translate("rewards.streaks.lifetime")}
              </Text>
              <Text className="text-white text-xl font-poppins-bold mt-1">
                {translate("rewards.streaks.status")}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
              <MaterialIcons name="stars" size={22} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-row gap-x-3 mt-4">
            <View className="flex-1 bg-white/15 rounded-2xl p-3 items-center">
              <Text className="text-white/70 text-[10px] font-poppins text-center">
                {translate("rewards.streaks.activeCards")}
              </Text>
              <Text className="text-white text-lg font-poppins-bold mt-1 text-center">
                {activeStamps}
              </Text>
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl p-3 items-center">
              <Text className="text-white/70 text-[10px] font-poppins text-center">
                {translate("rewards.streaks.highestStamps")}
              </Text>
              <Text className="text-white text-lg font-poppins-bold mt-1 text-center">
                {translate("rewards.streaks.stampsCount", { count: highestStampCount })}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-white/80 text-xs font-poppins">
              Keep stamping to unlock bonus rewards.
            </Text>
            <View className="flex-row items-center gap-x-1">
              <MaterialIcons name="emoji-events" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-poppins-semibold">
                {translate("rewards.streaks.weeklyQuest")}
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-y-3">
          {isLoading ? (
            <View className="items-center justify-center p-10 py-16 text-center">
              <Text className="text-neutral-500 font-poppins">{translate("rewards.streaks.loading")}</Text>
            </View>
          ) : activeStamps === 0 ? (
            <View className="bg-white dark:bg-neutral-800 rounded-3xl p-8 items-center">
              <MaterialIcons name="stars" size={40} color="#d1d5db" className="mb-2" />
              <Text className="text-neutral-500 font-poppins-semibold text-base mt-2">{translate("rewards.streaks.notFound")}</Text>
              <Text className="text-neutral-400 font-poppins text-xs text-center mt-2 px-4">
                {translate("rewards.streaks.notFoundDetail")}
              </Text>
            </View>
          ) : (
            stamps.map((stamp) => {
              const targetDays = stamp.target || 7; // For now assuming 7 day standard
              const completed = stamp.stamps_count;
              const bonus = 500; // Placeholder bonus points

              const progress = Math.round((completed / targetDays) * 100);
              const safeProgress = Math.min(Math.max(progress, 0), 100);
              const tier = getTier(completed);

              return (
                <TouchableOpacity
                  key={stamp.store_id}
                  onPress={() => router.push(`/store/${stamp.store_id}`)}
                  className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-neutral-100 dark:border-neutral-700"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-3">
                      <View className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-700 items-center justify-center">
                        <MaterialIcons name="storefront" size={20} color="#FF6600" />
                      </View>
                      <View>
                        <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
                          {stamp.stores?.name ?? translate("rewards.store")}
                        </Text>
                        <Text className="text-xs text-neutral-500 font-poppins mt-1">
                          {stamp.stores?.is_active ? translate("rewards.streaks.activeStore") : translate("rewards.streaks.inactiveStore")}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#94a3b8"
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-4">
                    <View className="flex-row items-center gap-x-2">
                      <Text className="text-xs font-poppins-medium text-neutral-400">
                        {translate("rewards.completed", { current: completed, target: targetDays })}
                      </Text>
                      <Text className={`text-xs font-poppins-semibold ${tier.color}`}>
                        {tier.label}
                      </Text>
                    </View>
                    <Text className="text-xs font-poppins-semibold text-primary">
                      {translate("rewards.streaks.bonusPts", { count: bonus })}
                    </Text>
                  </View>

                  <View className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full mt-3 overflow-hidden w-full">
                    <RNView
                      style={{
                        height: 8,
                        width: `${safeProgress}%`,
                        minWidth: 6,
                        backgroundColor: "#FF6600",
                        borderRadius: 999,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-[11px] text-neutral-400 font-poppins-medium">
                      {translate("rewards.streaks.percentComplete", { percent: progress })}
                    </Text>
                    <View className="flex-row items-center gap-x-1">
                      <MaterialIcons name="bolt" size={14} color="#FF6600" />
                      <Text className="text-[11px] text-neutral-500 font-poppins-medium">
                        {translate("rewards.streaks.reachingTarget")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
