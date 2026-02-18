import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import SortPill from "@/components/rewards/SortPill";
import RewardCard from "@/components/rewards/RewardCard";
import { rewards, stores } from "@/data/rewards";

const rewardSortOptions = [
  { id: "popular", label: "Popular" },
  { id: "points", label: "Points" },
  { id: "newest", label: "Newest" },
] as const;

type RewardSort = (typeof rewardSortOptions)[number]["id"];
type PointsOrder = "desc" | "asc";

export default function StoreRewards() {
  const params = useLocalSearchParams<{ storeId?: string | string[] }>();
  const storeId = Array.isArray(params.storeId)
    ? params.storeId[0]
    : params.storeId;
  const store = stores.find((item) => item.id === storeId);
  const [rewardSort, setRewardSort] = useState<RewardSort>("popular");
  const [pointsOrder, setPointsOrder] = useState<PointsOrder>("desc");

  const storeRewards = useMemo(() => {
    const list = rewards.filter((reward) => reward.storeId === storeId);
    if (rewardSort === "points") {
      list.sort((a, b) =>
        pointsOrder === "desc" ? b.points - a.points : a.points - b.points
      );
    } else if (rewardSort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list.sort((a, b) => a.popularity - b.popularity);
    }
    return list;
  }, [rewardSort, pointsOrder, storeId]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-8 gap-y-4"
      >
        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-neutral-200 items-center justify-center"
          >
            <MaterialIcons name="chevron-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-poppins-bold text-neutral-900">
              {store?.name ?? "Store Rewards"}
            </Text>
            <Text className="text-xs text-neutral-500 font-poppins mt-1">
              {store?.location ?? "Location"} •{" "}
              {store ? store.distanceMiles.toFixed(1) : "0.0"} miles away
            </Text>
          </View>
        </View>

        {store?.isNearby && !store?.isCheckedInToday && (
          <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center">
                <MaterialIcons name="near-me" size={18} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-primary font-poppins-semibold">
                  You are nearby {store.name}
                </Text>
                <Text className="text-xs text-primary/80 font-poppins mt-1">
                  Check in now to keep your streak active.
                </Text>
              </View>
            </View>
            <TouchableOpacity className="bg-primary px-3 py-2 rounded-full">
              <Text className="text-white text-[10px] font-poppins-semibold">
                CHECK IN
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {store && (
          <View className="bg-white rounded-2xl p-4 border border-neutral-100">
            <Text className="text-xs text-neutral-500 font-poppins">
              Points Balance
            </Text>
            <Text className="text-2xl font-poppins-bold text-primary mt-1">
              {store.points.toLocaleString()} pts
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900">
            Redeemable Rewards
          </Text>
          <Text className="text-xs text-neutral-400 font-poppins-medium">
            {storeRewards.length} items
          </Text>
        </View>

        <View className="flex-row gap-x-2">
          {rewardSortOptions.map((option) => {
            const isPoints = option.id === "points";
            const isActive = rewardSort === option.id;
            const arrowColor = isActive ? "#FF6600" : "#94a3b8";
            const arrowName =
              pointsOrder === "asc" ? "arrow-upward" : "arrow-downward";
            return (
              <SortPill
                key={option.id}
                label={option.label}
                active={isActive}
                rightIcon={
                  isPoints ? (
                    <MaterialIcons name={arrowName} size={12} color={arrowColor} />
                  ) : null
                }
                onPress={() => {
                  if (isPoints) {
                    if (rewardSort === "points") {
                      setPointsOrder(pointsOrder === "desc" ? "asc" : "desc");
                    } else {
                      setRewardSort("points");
                      setPointsOrder("desc");
                    }
                  } else {
                    setRewardSort(option.id);
                  }
                }}
              />
            );
          })}
        </View>

        <View className="gap-y-4">
          {storeRewards.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 border border-neutral-100 items-center">
              <Text className="text-neutral-500 font-poppins">
                No rewards available yet.
              </Text>
            </View>
          ) : (
            storeRewards.map((item) => (
              <RewardCard key={item.id} reward={item} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
