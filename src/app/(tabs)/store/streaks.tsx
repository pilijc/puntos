import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { View as RNView } from "react-native";
import { router } from "expo-router";
import { stores } from "@/data/rewards";

const streaks = [
  { storeId: "coffee-foundry", completed: 3, total: 7, bonus: 500 },
  { storeId: "bean-lab", completed: 1, total: 7, bonus: 300 },
  { storeId: "harbor-roast", completed: 5, total: 7, bonus: 700 },
];

export default function StoreStreaks() {
  const longestStreak = Math.max(...streaks.map((streak) => streak.completed));
  const activeStreaks = streaks.length;

  const getTier = (completed: number) => {
    if (completed >= 5) return { label: "Gold", color: "text-amber-500" };
    if (completed >= 3) return { label: "Silver", color: "text-slate-400" };
    return { label: "Bronze", color: "text-amber-700" };
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-10 gap-y-5"
      >
        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-neutral-200 items-center justify-center"
          >
            <MaterialIcons name="chevron-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-bold text-neutral-900">
            All Streaks
          </Text>
        </View>

        <View className="bg-primary rounded-3xl p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-xs font-poppins">
                Weekly Momentum
              </Text>
              <Text className="text-white text-xl font-poppins-bold mt-1">
                Streak Master
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
              <MaterialIcons name="local-fire-department" size={22} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-row gap-x-3 mt-4">
            <View className="flex-1 bg-white/15 rounded-2xl p-3 items-center">
              <Text className="text-white/70 text-[10px] font-poppins text-center">
                ACTIVE STREAKS
              </Text>
              <Text className="text-white text-lg font-poppins-bold mt-1 text-center">
                {activeStreaks}
              </Text>
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl p-3 items-center">
              <Text className="text-white/70 text-[10px] font-poppins text-center">
                LONGEST STREAK
              </Text>
              <Text className="text-white text-lg font-poppins-bold mt-1 text-center">
                {longestStreak} days
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-white/80 text-xs font-poppins">
              Keep checking in to unlock bonus rewards.
            </Text>
            <View className="flex-row items-center gap-x-1">
              <MaterialIcons name="emoji-events" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-poppins-semibold">
                Weekly Quest
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-y-3">
          {streaks.map((streak) => {
            const store = stores.find((item) => item.id === streak.storeId);
            const progress = Math.round((streak.completed / streak.total) * 100);
            const safeProgress = Math.min(Math.max(progress, 0), 100);
            const tier = getTier(streak.completed);
            return (
              <TouchableOpacity
                key={streak.storeId}
                onPress={() => router.push(`/store/${streak.storeId}`)}
                className="bg-white rounded-3xl p-4 border border-neutral-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-x-3">
                    <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                      <MaterialIcons name="storefront" size={20} color="#FF6600" />
                    </View>
                    <View>
                      <Text className="font-poppins-semibold text-neutral-900">
                        {store?.name ?? "Store"}
                      </Text>
                      <Text className="text-xs text-neutral-500 font-poppins mt-1">
                        {store?.location ?? "Location"}
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
                      {streak.completed}/{streak.total} COMPLETED
                    </Text>
                    <Text className={`text-xs font-poppins-semibold ${tier.color}`}>
                      {tier.label}
                    </Text>
                  </View>
                  <Text className="text-xs font-poppins-semibold text-primary">
                    +{streak.bonus} bonus pts
                  </Text>
                </View>

                <View className="h-2 bg-neutral-100 rounded-full mt-3 overflow-hidden w-full">
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
                    {progress}% complete
                  </Text>
                  <View className="flex-row items-center gap-x-1">
                    <MaterialIcons name="bolt" size={14} color="#FF6600" />
                    <Text className="text-[11px] text-neutral-500 font-poppins-medium">
                      Check in to keep streak alive
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
