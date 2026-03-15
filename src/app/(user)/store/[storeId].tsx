import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { Modal, View as RNView } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import SortPill from "@/components/rewards/SortPill";
import RewardCard from "@/components/rewards/RewardCard";
import { useStamps } from "@/hooks/use-stamps";
import { rewards } from "@/data/rewards";
import { useStoreStore } from "@/store/store-store";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import { supabase } from "@/supabase/supabase";
import { Alert, ActivityIndicator, RefreshControl } from "react-native";
import { addStamp } from "@/services/stamp-service";
import { useAuthStore } from "@/store/auth-store";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import StoreHeader from "@/components/ui/StoreHeader";

const rewardSortOptions = [
  { id: "popular", label: "Popular" },
  { id: "points", label: "Points" },
  { id: "newest", label: "Newest" },
] as const;

export default function StoreRewards() {
  const params = useLocalSearchParams<{ storeId?: string | string[] }>();
  const storeId = Array.isArray(params.storeId)
    ? params.storeId[0]
    : params.storeId;

  const {
    rewardSort,
    rewardPointsOrder: pointsOrder,
    setRewardSort,
    setRewardPointsOrder: setPointsOrder,
    isStamping,
    setIsStamping,
    refreshing,
    setRefreshing
  } = useRewardsUiStore();

  const { location } = useLocation();
  const { stores } = useStoreStore();

  // Enrich stores with location data
  const storesWithLocation = useMemo(() => {
    return enrichStoresWithLocation(stores, location);
  }, [stores, location]);

  const store = storesWithLocation.find((item) => item.id.toString() === storeId);
  const [selectedReward, setSelectedReward] = React.useState<typeof rewards[0] | null>(null);

  const { isLoading: isStampsLoading, refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStamps(), refetchStampRewards()]);
    setRefreshing(false);
  };

  const handleStamp = async () => {
    if (!storeId) return;

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

  const { stamps } = useStamps();
  const storeStampData = useMemo(() => {
    return stamps.find((s) => s.store_id?.toString() === storeId);
  }, [stamps, storeId]);

  // Helper to check if this store has been stamped today
  const hasStampedToday = useMemo(() => {
    if (!storeStampData?.last_stamp_at) return false;

    const lastStampDate = new Date(storeStampData.last_stamp_at);
    const today = new Date();

    return (
      lastStampDate.getFullYear() === today.getFullYear() &&
      lastStampDate.getMonth() === today.getMonth() &&
      lastStampDate.getDate() === today.getDate()
    );
  }, [storeStampData]);

  const hasClaimableReward = storeStampData && storeStampData.stamps_count >= storeStampData.target;
  const claimableRewardItem = useMemo(() => {
    // For now, mock the claimable reward using the first reward of the store
    return rewards.find((r) => r.storeId === storeId) || rewards[0];
  }, [storeId]);

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
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6600"
            colors={["#FF6600"]}
          />
        }
      >
        <StoreHeader
          title={store?.name ?? "Store Rewards"}
          subtitle={`${store?.address ?? "Location"} • ${store ? (store.distanceMeters ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} meters away`}
          variant="circular"
        />

        {store?.isNearby && (
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
                  Stamp now to collect another stamp!
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className={`${hasStampedToday ? "bg-primary/50" : "bg-primary"} px-3 py-2 rounded-full`}
              onPress={handleStamp}
              disabled={isStamping || hasStampedToday || isStampsLoading}
            >
              {isStamping || isStampsLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-[10px] font-poppins-semibold">
                  {hasStampedToday ? "STAMPED" : "STAMP"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {hasClaimableReward && (
          <View className="mb-4">
            <Text className="text-lg font-poppins-semibold text-neutral-900 mb-3">
              Your Unlocked Reward
            </Text>
            <View className="bg-primary/5 rounded-2xl p-4 border border-primary/20 flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-3 flex-1">
                <View className="w-12 h-12 rounded-xl bg-white items-center justify-center overflow-hidden border border-neutral-100">
                  {claimableRewardItem?.imageUrl && (
                    <Image
                      source={claimableRewardItem.imageUrl}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-primary font-poppins-semibold leading-tight">
                    {claimableRewardItem?.title || "Free Reward"}
                  </Text>
                  <Text className="text-xs text-neutral-500 font-poppins mt-0.5">
                    Ready to claim!
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-primary px-5 py-2.5 rounded-xl shadow-sm"
                onPress={() => setSelectedReward(claimableRewardItem)}
              >
                <Text className="text-white text-xs font-poppins-bold tracking-wide">
                  CLAIM
                </Text>
              </TouchableOpacity>
            </View>
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
            <View className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-6 border border-neutral-100 dark:border-darkBorder items-center">
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
