import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import SortPill from "@/components/rewards/SortPill";
import RewardCard from "@/components/rewards/RewardCard";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import StoreHeader from "@/components/ui/StoreHeader";
import StoreScreenContainer from "@/components/ui/StoreScreenContainer";
import { useStoreDetailActions } from "@/hooks/use-store-detail-actions";
import { useStoreDetailData } from "@/hooks/use-store-detail-data";

const rewardSortOptions = [
  { id: "popular", labelKey: "popular" },
  { id: "points", labelKey: "points" },
  { id: "newest", labelKey: "newest" },
] as const;

export default function StoreRewards() {
  const { t: translate } = useTranslation();
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
    refreshing,
  } = useRewardsUiStore();
  const {
    store,
    hasStampedToday,
    hasClaimableReward,
    claimableRewardItem,
    storeRewards,
    isStampsLoading,
  } = useStoreDetailData(storeId);
  const { onRefresh, handleStamp } = useStoreDetailActions(storeId);

  return (
    <StoreScreenContainer
      contentContainerClassName="gap-y-4"
      contentGap={16}
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
        title={store?.name ?? translate("rewards.storeDetail.title")}
        subtitle={`${store?.address ?? translate("rewards.storeDetail.locationFallback")} - ${translate("rewards.distanceMeters", {
          meters: store
            ? (store.distanceMeters ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })
            : "0",
        })}`}
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
                {hasStampedToday
                  ? translate("rewards.buttons.stamped")
                  : translate("rewards.buttons.stamp")}
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
              onPress={() => { }}
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
              label={translate(`rewards.filters.${option.labelKey}`)}
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
    </StoreScreenContainer>
  );
}
