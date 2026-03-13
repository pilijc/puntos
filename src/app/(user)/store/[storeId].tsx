import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import { Modal, View as RNView } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import SortPill from "@/components/rewards/SortPill";
import RewardCard from "@/components/rewards/RewardCard";
import { useStamps } from "@/hooks/use-stamps";
import { rewards } from "@/data/rewards";
import { useStoreStore } from "@/store/store-store";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import { supabase } from "@/supabase/supabase";
import { Alert, ActivityIndicator, RefreshControl } from "react-native";
import { addStamp } from "@/services/stamp-service";
import { useAuthStore } from "@/store/auth-store";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useTranslation } from "react-i18next";

const rewardSortOptions = [
  { id: "popular", label: "Popular" },
  { id: "points", label: "Points" },
  { id: "newest", label: "Newest" },
] as const;

type RewardSort = (typeof rewardSortOptions)[number]["id"];
type PointsOrder = "desc" | "asc";

export default function StoreRewards() {
  const { t: translate } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string | string[] }>();
  const storeId = Array.isArray(params.storeId)
    ? params.storeId[0]
    : params.storeId;
  const { location } = useLocation();
  const { stores } = useStoreStore();

  // Enrich stores with location data
  const storesWithLocation = useMemo(() => {
    return enrichStoresWithLocation(stores, location);
  }, [stores, location]);

  const store = storesWithLocation.find((item) => item.id.toString() === storeId);
  const [rewardSort, setRewardSort] = useState<RewardSort>("popular");
  const [pointsOrder, setPointsOrder] = useState<PointsOrder>("desc");
  const [selectedReward, setSelectedReward] = useState<typeof rewards[0] | null>(null);

  const { sessionToken } = useAuthStore();
  const { stamps, isLoading: isStampsLoading, refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const [isStamping, setIsStamping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        Alert.alert(translate("rewards.messages.error"), translate("rewards.messages.signInToStamp"));
        setIsStamping(false);
        return;
      }
      const result = await addStamp(user.id, storeId.toString());
      if (result.success) {
        Alert.alert(translate("rewards.messages.success"), translate("rewards.messages.stampSuccess"));
        refetchStamps();
        refetchStampRewards();
      } else {
        if (result.reason === "already_stamped_today") {
          Alert.alert(translate("rewards.messages.notice"), translate("rewards.messages.alreadyStamped"));
        } else if (result.reason === "stamp_not_enabled") {
          Alert.alert(translate("rewards.messages.notice"), translate("rewards.messages.stampDisabled"));
        } else {
          Alert.alert(translate("rewards.messages.error"), translate("rewards.messages.stampFailed"));
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(translate("rewards.messages.error"), translate("rewards.messages.error"));
    } finally {
      setIsStamping(false);
    }
  };

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
        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder items-center justify-center"
          >
            <MaterialIcons name="chevron-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
              {store?.name ?? translate("rewards.storeDetail.title")}
            </Text>
            <Text className="text-xs text-neutral-500 font-poppins mt-1">
              {store?.address ?? translate("rewards.storeDetail.locationFallback")} •{" "}
              {store ? store.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} {translate("rewards.distanceMeters", { meters: "" }).replace(" meters away", "").replace(" m 先", "").trim()} {translate("rewards.distanceMeters", { meters: "" }).includes("m 先") ? "m 先" : "meters away"}
            </Text>
          </View>
        </View>

        {store?.isNearby && (
          <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center">
                <MaterialIcons name="near-me" size={18} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-primary font-poppins-semibold">
                  {translate("rewards.storeDetail.nearbyMessage", { name: store.name })}
                </Text>
                <Text className="text-xs text-primary/80 font-poppins mt-1">
                  {translate("rewards.storeDetail.stampNowPrompt")}
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
                  {hasStampedToday ? translate("rewards.buttons.stamped") : translate("rewards.buttons.stamp")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {hasClaimableReward && (
          <View className="mb-4">
            <Text className="text-lg font-poppins-semibold text-neutral-900 mb-3">
              {translate("rewards.storeDetail.unlockedSection")}
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
                    {claimableRewardItem?.title || translate("rewards.storeDetail.freeReward")}
                  </Text>
                  <Text className="text-xs text-neutral-500 font-poppins mt-0.5">
                    {translate("rewards.storeDetail.readyToClaim")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-primary px-5 py-2.5 rounded-xl shadow-sm"
                onPress={() => setSelectedReward(claimableRewardItem)}
              >
                <Text className="text-white text-xs font-poppins-bold tracking-wide">
                  {translate("rewards.claim")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900">
            {translate("rewards.storeDetail.redeemableSection")}
          </Text>
          <Text className="text-xs text-neutral-400 font-poppins-medium">
            {translate("rewards.storeDetail.itemsCount", { count: storeRewards.length })}
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
                label={translate(`rewards.filters.${option.id.toLowerCase()}`)}
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
                {translate("rewards.storeDetail.noRewards")}
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
