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
import React, { useMemo, useState, useEffect } from "react";
import { FadeIn, FadeOut, Layout, Easing } from "react-native-reanimated";
import { router } from "expo-router";
import RewardCard from "@/components/rewards/RewardCard";
import SortPill from "@/components/rewards/SortPill";
import { rewards, storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useStoreStore } from "@/store/store-store";
import { useAuthStore } from "@/store/auth-store";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import { addStamp } from "@/services/stamp-service";
import { supabase } from "@/supabase/supabase";
import { Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";

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
  const { stores } = useStoreStore();
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const { location, permissionStatus } = useLocation();

  const storesWithLocation = useMemo(() => {
    const thresholdMiles = 30 / 1609.344; // 30 meters
    return enrichStoresWithLocation(stores, location, thresholdMiles);
  }, [stores, location]);

  const nearbyStores = storesWithLocation.filter((store) => store.isNearby);
  const featuredStore = nearbyStores[0] ?? storesWithLocation[0];

  const { sessionToken } = useAuthStore();
  const { stamps, refetch: refetchStamps } = useStamps();
  const { stampRewards, refetch: refetchStampRewards } = useStampRewards();

  const [isStamping, setIsStamping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStamps(), refetchStampRewards()]);
    setRefreshing(false);
  };

  const handleStamp = async (storeId: number) => {
    setIsStamping(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert("Error", "You must be logged in to stamp.");
        setIsStamping(false);
        return;
      }

      const result = await addStamp(user.id, storeId.toString());
      if (result.success) {
        Alert.alert("Success!", "You have successfully collected a stamp!");
        refetchStamps();
        refetchStampRewards();
      } else {
        if (result.reason === "already_stamped_today") {
          Alert.alert("Notice", "You have already stamped at this store today.");
        } else if (result.reason === "stamp_not_enabled") {
          Alert.alert("Notice", "This store currently has stamps disabled.");
        } else {
          Alert.alert("Error", "Failed to collect stamp. Please try again.");
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsStamping(false);
    }
  };

  const currentStampReward = useMemo(() => {
    if (!featuredStore) return null;
    return stampRewards.find((s) => s.store_id.toString() === featuredStore.id.toString());
  }, [stampRewards, featuredStore]);

  const streakDaysCount = currentStampReward?.current_stamp_count || 0;

  const dynamicStreakDays = useMemo(() => {
    const days = [];
    const dayLabels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
    for (let i = 0; i < 7; i++) {
      days.push({
        label: dayLabels[i],
        completed: i < streakDaysCount,
        isTarget: i === 6,
      });
    }
    return days;
  }, [streakDaysCount]);

  // Helper to check if a specific store has been stamped today
  const hasStampedToday = (storeId: number) => {
    const stampProgress = stamps.find(s => s.store_id === storeId);
    if (!stampProgress?.last_stamp_at) return false;

    const lastStampDate = new Date(stampProgress.last_stamp_at);
    const today = new Date();

    return (
      lastStampDate.getFullYear() === today.getFullYear() &&
      lastStampDate.getMonth() === today.getMonth() &&
      lastStampDate.getDate() === today.getDate()
    );
  };

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

  // Request location permission on mount if not granted
  useEffect(() => {
    if (!permissionStatus.granted && permissionStatus.canAskAgain) {
      // Optionally auto-request, or let user enable in settings
      // requestLocationPermission();
    }
  }, [permissionStatus]);

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6600"
            colors={["#FF6600"]}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
            Rewards
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/store/stores")}
            className="px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          >
            <Text className="text-xs font-poppins-semibold text-neutral-700 dark:text-neutral-300">
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
                  {featuredStore?.address ?? "Somewhere"} •{" "}
                  {featuredStore ? featuredStore.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} meters away
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
                      ? `${nearbyStores.length} store${nearbyStores.length > 1 ? "s" : ""
                      } nearby for stamping`
                      : "Stamp now to earn today's points"}
                  </Text>
                </View>
                <MaterialIcons
                  name={isNearbyOpen ? "expand-less" : "expand-more"}
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
              <TouchableOpacity
                className="bg-white px-4 py-2 rounded-full"
                onPress={() => nearbyStores.length > 0 && handleStamp(nearbyStores[0].id)}
                disabled={isStamping || (nearbyStores.length > 0 && hasStampedToday(nearbyStores[0].id))}
              >
                {isStamping ? (
                  <ActivityIndicator size="small" color="#FF6600" />
                ) : (
                  <Text className={`font-poppins-semibold text-xs ${nearbyStores.length > 0 && hasStampedToday(nearbyStores[0].id) ? "text-neutral-400" : "text-primary"}`}>
                    {nearbyStores.length > 0 && hasStampedToday(nearbyStores[0].id)
                      ? "STAMPED"
                      : (nearbyStores.length > 1 ? "STAMP ALL" : "STAMP")}
                  </Text>
                )}
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
                        {store.logo ? (
                          <Image
                            source={{ uri: store.logo }}
                            className="w-full h-full"
                            contentFit="cover"
                            contentPosition="center"
                          />
                        ) : storeLogos[store.id.toString()] ? (
                          <Image
                            source={storeLogos[store.id.toString()]}
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
                          {store.address} • {store.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"} meters
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-x-2">
                      <TouchableOpacity
                        className={`px-3 py-1 rounded-full ${hasStampedToday(store.id) ? "bg-white/50" : "bg-white"}`}
                        onPress={() => handleStamp(store.id)}
                        disabled={isStamping || hasStampedToday(store.id)}
                      >
                        {isStamping ? (
                          <ActivityIndicator size="small" color="#FF6600" />
                        ) : (
                          <Text className={`text-[10px] font-poppins-semibold ${hasStampedToday(store.id) ? "text-neutral-500" : "text-primary"}`}>
                            {hasStampedToday(store.id) ? "STAMPED" : "STAMP"}
                          </Text>
                        )}
                      </TouchableOpacity>
                      {!hasStampedToday(store.id) && (
                        <TouchableOpacity>
                          <Text className="text-white/80 text-[10px] font-poppins-semibold">
                            SKIP
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </AnimatedView>
            )}
          </AnimatedView>
        </View>

        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2">
              <MaterialIcons
                name="local-fire-department"
                size={18}
                color="#FF6600"
              />
              <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
                Stamp Reward
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/store/streaks")}
              className="flex-row items-center gap-x-1"
            >
              <Text className="text-primary text-xs font-poppins-semibold">
                ALL STAMPS
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-neutral-500 font-poppins mt-2">
            Current store:{" "}
            <Text className="font-poppins-semibold text-neutral-700">
              {featuredStore?.name ?? "No nearby store detected"}
            </Text>
            {featuredStore ? ` • ${featuredStore.address}` : ""}
          </Text>

          <Text className="text-xs font-poppins-medium text-neutral-400 mt-2">
            {streakDaysCount}/7 COMPLETED
          </Text>

          <View className="flex-row justify-between mt-4">
            {dynamicStreakDays.map((day, index) => {
              const isCompleted = day.completed;
              const isTarget = day.isTarget;
              const circleClass = isCompleted
                ? "w-8 h-8 rounded-full bg-primary items-center justify-center"
                : isTarget
                  ? "w-8 h-8 rounded-full border border-primary items-center justify-center"
                  : "w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-700 items-center justify-center";
              const textClass =
                isCompleted || isTarget
                  ? "text-primary font-poppins-semibold text-xs"
                  : "text-neutral-400 font-poppins-semibold text-xs";
              return (
                <View key={`${day.label}-${index}`} className="items-center w-10">
                  <View className={circleClass}>
                    {isCompleted ? (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    ) : (
                      <Text className={textClass}>{index + 1}</Text>
                    )}
                  </View>
                  <Text className="text-[11px] mt-1 text-neutral-400 font-poppins-medium text-center whitespace-nowrap">
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
          <Text className="text-lg font-poppins-semibold text-neutral-900 dark:text-white">
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
            const store = storesWithLocation.find((entry) => entry.id.toString() === item.storeId);
            return (
              <RewardCard
                key={item.id}
                reward={item}
                storeName={store?.name}
                storeLocation={store?.address}
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

