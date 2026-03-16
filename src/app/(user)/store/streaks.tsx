import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import React from "react";
import { useStamps } from "@/hooks/use-stamps";
import StoreHeader from "@/components/ui/StoreHeader";
import UserStreakListItem from "@/components/rewards/UserStreakListItem";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StoreStreaks() {
  const { stamps, isLoading } = useStamps();
  const insets = useSafeAreaInsets();

  const activeStamps = stamps.length;
  // Guard against spread on empty array
  const highestStampCount = activeStamps > 0
    ? Math.max(...stamps.map((s) => s.stamps_count))
    : 0;

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-darkBackground"
      edges={["left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 40),
          rowGap: 20,
        }}
      >
        <StoreHeader
          title="All Stamps"
          variant="circular"
          containerClassName="mb-2 mt-4"
        />

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
            stamps.map((stamp) => (
              <UserStreakListItem key={stamp.store_id} stamp={stamp} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
