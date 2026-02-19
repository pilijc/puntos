import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  AnimatedView,
  Image,
} from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import { FadeIn, FadeOut, Layout, Easing } from "react-native-reanimated";
import { router } from "expo-router";
import RewardCard from "@/components/rewards/RewardCard";
import SortPill from "@/components/rewards/SortPill";
import { rewards, stores, storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";

const streakDays = [
  { label: "MON", completed: true },
  { label: "TUE", completed: true },
  { label: "WED", completed: true },
  { label: "THU", completed: false },
  { label: "FRI", completed: false },
  { label: "SAT", completed: false },
  { label: "SUN", completed: false, isTarget: true },
];

const rewardSortOptions = [
  { id: "popular", label: "Popular" },
  { id: "points", label: "Points" },
  { id: "newest", label: "Newest" },
] as const;

export default function Rewards() {
  const {
    rewardSort,
    rewardPointsOrder,
    setRewardSort,
    setRewardPointsOrder,
  } = useRewardsUiStore();
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const nearbyStores = stores.filter((store) => store.isNearby);
  const featuredStore = nearbyStores[0] ?? stores[0];

  const sortedRewards = useMemo(() => {
    const list = [...rewards];
    if (rewardSort === "points") {
      list.sort((a, b) =>
        rewardPointsOrder === "desc" ? b.points - a.points : a.points - b.points
      );
    } else if (rewardSort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list.sort((a, b) => a.popularity - b.popularity);
    }
    return list.slice(0, 3);
  }, [rewardSort, rewardPointsOrder]);

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-6"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-poppins-bold text-neutral-900">
            Rewards
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/store/stores")}
            className="px-3 py-2 rounded-full border border-neutral-200 bg-white"
          >
            <Text className="text-xs font-poppins-semibold text-neutral-700">
              VIEW STORES
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-y-0">
          <View className="-mx-6 overflow-hidden bg-neutral-300 h-64 relative">
            <Image
              source={require("../../../assets/images/rewards/coffee-shop.png")}
              className="absolute inset-0 w-full h-full"
              contentFit="cover"
              contentPosition="center"
            />
            <View className="absolute inset-0 bg-neutral-900/35" />

            <View className="absolute top-4 left-6 right-6 flex-row items-center justify-between">
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                onPress={() => router.back()}
              >
                <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="w-9 h-9 rounded-full bg-black/40 items-center justify-center">
                <MaterialIcons name="share" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="absolute bottom-8 left-6 right-6">
              <Text className="text-2xl font-poppins-bold text-white">
                {featuredStore?.name ?? "Featured Store"}
              </Text>
              <View className="flex-row items-center gap-x-2 mt-1">
                <MaterialIcons name="place" size={16} color="#FFFFFF" />
                <Text className="text-white/90 font-poppins text-xs">
                  {featuredStore?.location ?? "Brooklyn, NY"} •{" "}
                  {featuredStore?.distanceMiles.toFixed(1) ?? "0.0"} miles away
                </Text>
              </View>
            </View>
          </View>

          <AnimatedView
            layout={Layout.duration(260).easing(Easing.out(Easing.cubic))}
            className="bg-primary rounded-2xl p-4 gap-y-3 -mt-6 border border-primary/20"
          >
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setIsNearbyOpen((prev) => !prev)}
                className="flex-row items-center gap-x-3 flex-1"
              >
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                  <MaterialIcons name="check" size={20} color="#FF6600" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-poppins-semibold">
                    You are within range!
                  </Text>
                  <Text className="text-white/85 text-xs font-poppins mt-1">
                    {nearbyStores.length > 0
                      ? `${nearbyStores.length} store${
                          nearbyStores.length > 1 ? "s" : ""
                        } nearby for check-in`
                      : "Check-in now to earn today's points"}
                  </Text>
                </View>
                <MaterialIcons
                  name={isNearbyOpen ? "expand-less" : "expand-more"}
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
              <TouchableOpacity className="bg-white px-4 py-2 rounded-full">
                <Text className="text-primary font-poppins-semibold text-xs">
                  {nearbyStores.length > 1 ? "CHECK IN ALL" : "CHECK IN"}
                </Text>
              </TouchableOpacity>
            </View>

            {isNearbyOpen && nearbyStores.length > 0 && (
              <AnimatedView
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                layout={Layout.duration(240).easing(Easing.out(Easing.cubic))}
                className="bg-white/10 rounded-xl p-3 gap-y-3"
              >
                {nearbyStores.map((store) => (
                  <View
                    key={store.id}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-x-3 flex-1">
                      <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center overflow-hidden">
                        {storeLogos[store.id] ? (
                          <Image
                            source={storeLogos[store.id]}
                            className="w-full h-full"
                            contentFit="cover"
                            contentPosition="center"
                          />
                        ) : (
                          <Text className="text-[9px] text-white/80 font-poppins">
                            LOGO
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-poppins-semibold">
                          {store.name}
                        </Text>
                        <Text className="text-white/80 text-xs font-poppins mt-1">
                          {store.location} • {store.distanceMiles.toFixed(1)} miles
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-x-2">
                      <TouchableOpacity className="bg-white px-3 py-1 rounded-full">
                        <Text className="text-primary text-[10px] font-poppins-semibold">
                          CHECK IN
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Text className="text-white/80 text-[10px] font-poppins-semibold">
                          SKIP
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </AnimatedView>
            )}
          </AnimatedView>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-neutral-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2">
              <MaterialIcons
                name="local-fire-department"
                size={18}
                color="#FF6600"
              />
              <Text className="font-poppins-semibold text-neutral-900">
                7-Day Streak
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/store/streaks")}
              className="flex-row items-center gap-x-1"
            >
              <Text className="text-primary text-xs font-poppins-semibold">
                ALL STREAKS
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-neutral-500 font-poppins mt-2">
            Current store:{" "}
            <Text className="font-poppins-semibold text-neutral-700">
              {featuredStore?.name ?? "No nearby store detected"}
            </Text>
            {featuredStore ? ` • ${featuredStore.location}` : ""}
          </Text>

          <Text className="text-xs font-poppins-medium text-neutral-400 mt-2">
            3/7 COMPLETED
          </Text>

          <View className="flex-row justify-between mt-4">
            {streakDays.map((day, index) => {
              const isCompleted = day.completed;
              const isTarget = day.isTarget;
              const circleClass = isCompleted
                ? "w-8 h-8 rounded-full bg-primary items-center justify-center"
                : isTarget
                ? "w-8 h-8 rounded-full border border-primary items-center justify-center"
                : "w-8 h-8 rounded-full bg-neutral-100 items-center justify-center";
              const textClass =
                isCompleted || isTarget
                  ? "text-primary font-poppins-semibold text-xs"
                  : "text-neutral-400 font-poppins-semibold text-xs";
              return (
                <View key={`${day.label}-${index}`} className="items-center w-8">
                  <View className={circleClass}>
                    {isCompleted ? (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    ) : (
                      <Text className={textClass}>{index + 1}</Text>
                    )}
                  </View>
                  <Text className="text-[10px] mt-1 text-neutral-400 font-poppins-medium">
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text className="text-xs text-neutral-500 font-poppins mt-3">
            Finish your 7-day streak to earn{" "}
            <Text className="text-primary font-poppins-semibold">
              +500 bonus Puntos
            </Text>
            !
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900">
            Reward Catalog
          </Text>
          <TouchableOpacity className="flex-row items-center gap-x-1">
            <Text className="text-primary text-xs font-poppins-semibold">
              VIEW ALL
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#FF6600" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-x-2">
          {rewardSortOptions.map((option) => {
            const isPoints = option.id === "points";
            const isActive = rewardSort === option.id;
            const arrowColor = isActive ? "#FF6600" : "#94a3b8";
            const arrowName =
              rewardPointsOrder === "asc" ? "arrow-upward" : "arrow-downward";
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
                      setRewardPointsOrder(
                        rewardPointsOrder === "desc" ? "asc" : "desc"
                      );
                    } else {
                      setRewardSort("points");
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
          {sortedRewards.map((item) => {
            const store = stores.find((entry) => entry.id === item.storeId);
            return (
              <RewardCard
                key={item.id}
                reward={item}
                storeName={store?.name}
                storeLocation={store?.location}
              />
            );
          })}
        </View>

        <View className="items-center pt-4">
          <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
            POWERED BY PUNTOS
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

