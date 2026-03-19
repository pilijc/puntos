import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  AnimatedView,
  Image,
} from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { FadeIn, FadeOut, Layout, Easing } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import { Dimensions } from "react-native";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import UserStoreHeroCarousel from "@/components/stores/user-store-hero-carousel";
import UserStreakCard from "@/components/rewards/user-streak-card";
import UserStampLogCard from "@/components/rewards/user-stamp-log-card";
import RewardCard from "@/components/rewards/reward-card";
import SortPill from "@/components/rewards/sort-pill";
import { storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStoreOverviewData } from "@/hooks/use-store-overview-data";
import StoreScreenContainer from "@/components/ui/store-screen-container";

const { width: screenWidth } = Dimensions.get("window");

const rewardSortOptions = [
  { id: "popular", labelKey: "popular" },
  { id: "points", labelKey: "points" },
  { id: "newest", labelKey: "newest" },
] as const;

export default function Rewards() {
  const { t: translate } = useTranslation();
  const {
    rewardSort,
    rewardPointsOrder,
    setRewardSort,
    setRewardPointsOrder,
    isNearbyOpen,
    setIsNearbyOpen,
    isStampLogOpen,
    setIsStampLogOpen,
    carouselIndex,
    setCarouselIndex,
    setHeroIndex,
    isStamping,
    refreshing,
  } = useRewardsUiStore();
  const router = useRouter();
  const {
    activeStampProgramRewards,
    handleCarouselInteraction,
    handleRefresh,
    hasStampedToday,
    isAutoPlayEnabled,
    isStoreNearby,
    nearbyStores,
    sortedRewards,
    stampRewards,
    storesWithLocation,
    displayStamps,
    displayStreaks,
    swipeIndicatorStyle,
  } = useStoreOverviewData();

  return (
    <StoreScreenContainer
      backgroundClassName="bg-backgroundMuted dark:bg-darkBackground"
      contentContainerClassName="gap-y-6"
      contentGap={24}
      onTouchStart={handleCarouselInteraction}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => handleRefresh()}
          tintColor="#FF6600"
          colors={["#FF6600"]}
        />
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
          {translate("user.rewards.title")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/store/stores")}
          className="px-3 py-2 rounded-full border border-neutral-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted"
        >
          <Text className="text-xs font-poppins-semibold text-neutral-700 dark:text-darkTextSoft">
            {translate("user.rewards.viewStores")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="gap-y-0">
        <UserStoreHeroCarousel
          nearbyStores={nearbyStores}
          storesWithLocation={storesWithLocation}
          setHeroIndex={setHeroIndex}
          swipeIndicatorStyle={swipeIndicatorStyle}
        />

        <AnimatedView
          layout={Layout.duration(260).easing(Easing.out(Easing.cubic))}
          className="bg-white dark:bg-darkBackgroundCard rounded-xl p-4 gap-y-3 -mt-6 mx-1"
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setIsNearbyOpen(!isNearbyOpen)}
              className="flex-row items-center gap-x-3 flex-1"
              disabled={nearbyStores.length === 0}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <MaterialIcons
                  name={nearbyStores.length > 0 ? "check" : "location-off"}
                  size={20}
                  color={nearbyStores.length > 0 ? "#FF6600" : "#9ca3af"}
                />
              </View>
              <View className="flex-1 pr-2 justify-center">
                <Text
                  className="text-primary font-poppins-semibold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {nearbyStores.length > 1
                    ? translate("user.rewards.range.multiple", { count: nearbyStores.length })
                    : nearbyStores.length === 1
                      ? translate("user.rewards.range.single")
                      : translate("user.rewards.range.empty")}
                </Text>
                <Text
                  className="text-neutral-500 dark:text-neutral-400 text-[11px] font-poppins mt-1"
                  numberOfLines={1}
                >
                  {nearbyStores.length > 0
                    ? translate("user.rewards.range.promptNearby")
                    : translate("user.rewards.range.promptFar")}
                </Text>
              </View>
              {nearbyStores.length > 0 && (
                <MaterialIcons
                  name={isNearbyOpen ? "expand-less" : "expand-more"}
                  size={20}
                  color="#FF6600"
                />
              )}
            </Pressable>
            {nearbyStores.length === 0 ? (
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-full"
                onPress={() => router.push("/")}
              >
                <Text className="font-poppins-semibold text-xs text-white">
                  {translate("user.rewards.explore")}
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>

          {isNearbyOpen && nearbyStores.length > 0 && (
            <AnimatedView
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={Layout.duration(240).easing(Easing.out(Easing.cubic))}
              className="bg-neutral-50/80 dark:bg-white/5 rounded-xl p-3 gap-y-3"
            >
              {nearbyStores.map((store) => (
                <View key={store.id} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-x-3 flex-1">
                    <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center overflow-hidden">
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
                        <Text className="text-[10px] text-primary/80 font-poppins">
                          {translate("user.rewards.store").toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-900 dark:text-neutral-100 font-poppins-semibold">
                        {store.name}
                      </Text>
                      <Text className="text-neutral-500 dark:text-neutral-400 text-xs font-poppins mt-1">
                        {store.address} - {translate("user.rewards.distanceMeters", {
                          meters:
                            store.distanceMeters?.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            }) ?? "0",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <TouchableOpacity
                      className={`px-3 py-1 rounded-full ${hasStampedToday(Number(store.id)) ? "bg-neutral-200 dark:bg-white/10" : "bg-primary"}`}
                      onPress={() => router.push("/qr")}
                      disabled={isStamping || hasStampedToday(Number(store.id))}
                    >
                      {isStamping ? (
                        <ActivityIndicator size="small" color="#FF6600" />
                      ) : (
                        <Text
                          className={`text-[10px] font-poppins-semibold ${hasStampedToday(Number(store.id)) ? "text-neutral-500" : "text-white"}`}
                        >
                          {hasStampedToday(Number(store.id))
                            ? translate("user.rewards.buttons.stamped")
                            : translate("user.rewards.buttons.stamp")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </AnimatedView>
          )}
        </AnimatedView>
      </View>

      <View>
        {nearbyStores.length > 0 && displayStreaks.length === 0 && displayStamps.length === 0 && (
          <AnimatedView
            entering={FadeIn.duration(400)}
            className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-8 items-center border border-neutral-100 dark:border-darkBorder mx-1"
          >
            <MaterialIcons name="event-note" size={40} color="#FF6600" />
            <Text className="text-lg font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary mt-3 text-center">
              {translate("user.rewards.upcomingEvents.title")}
            </Text>
            <Text className="text-neutral-500 text-center font-poppins text-xs mt-1 px-4">
              {translate("user.rewards.upcomingEvents.subtitle")}
            </Text>
          </AnimatedView>
        )}

        {displayStreaks.length > 0 && (
          <View className="mb-3">
            <Carousel
              width={screenWidth - 48}
              height={150}
              data={displayStreaks}
              scrollAnimationDuration={1000}
              enabled={displayStreaks.length > 1}
              loop={displayStreaks.length > 1}
              autoPlay={isAutoPlayEnabled && displayStreaks.length > 1}
              autoPlayInterval={3500}
              onScrollStart={handleCarouselInteraction}
              onSnapToItem={(index) => setCarouselIndex(index)}
              renderItem={({ item: streak }) => (
                <UserStreakCard
                  key={streak.store_id}
                  streak={streak}
                  nearbyStores={nearbyStores}
                  isStoreNearby={isStoreNearby}
                />
              )}
            />
          </View>
        )}

        {displayStamps.length === 0 ? (
          nearbyStores.length === 0 && (
            <View className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-6 items-center mx-1">
              <MaterialIcons name="stars" size={32} color="#d1d5db" className="mb-2" />
              <Text className="text-neutral-500 font-poppins-semibold text-sm mt-2">
                {translate("user.rewards.noActiveStamps")}
              </Text>
              <Text className="text-neutral-400 font-poppins text-xs text-center mt-1">
                {translate("user.rewards.visitStartStamps")}
              </Text>
            </View>
          )
        ) : (
          <View>
            <Carousel
              width={screenWidth - 48}
              height={isStampLogOpen ? 250 : 150}
              data={displayStamps}
              scrollAnimationDuration={1000}
              enabled={displayStamps.length > 1}
              loop={displayStamps.length > 1}
              autoPlay={isAutoPlayEnabled && displayStamps.length > 1}
              autoPlayInterval={3000}
              onScrollStart={handleCarouselInteraction}
              onSnapToItem={(index) => setCarouselIndex(index)}
              renderItem={({ item: stamp }) => (
                <UserStampLogCard
                  key={stamp.store_id}
                  stamp={stamp}
                  nearbyStores={nearbyStores}
                  isStoreNearby={isStoreNearby}
                  stampRewards={stampRewards}
                  activeStampProgramRewards={activeStampProgramRewards}
                  isStampLogOpen={isStampLogOpen}
                  onToggleExpand={() => setIsStampLogOpen(!isStampLogOpen)}
                />
              )}
            />

            {displayStamps.length > 1 && (
              <View className="flex-row justify-center items-center gap-x-2 mt-1">
                {displayStamps.map((_, index) => (
                  <View
                    key={index}
                    className={`h-1.5 rounded-full ${carouselIndex === index
                      ? "w-5 bg-primary"
                      : "w-1.5 bg-neutral-300 dark:bg-neutral-600"
                      }`}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View className="gap-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
            {translate("user.rewards.rewardCatalog")}
          </Text>
          <TouchableOpacity className="flex-row items-center gap-x-1">
            <Text className="text-primary text-xs font-poppins-semibold">
              {translate("user.rewards.viewAll")}
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
                label={translate(`user.rewards.filters.${option.labelKey}`)}
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
                        rewardPointsOrder === "desc" ? "asc" : "desc",
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
            const store = storesWithLocation.find(
              (entry) => entry.id.toString() === item.storeId,
            );
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
      </View>

      <View className="items-center pt-4">
        <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
          {translate("user.rewards.footer")}
        </Text>
      </View>
    </StoreScreenContainer>
  );
}
