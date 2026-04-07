import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  AnimatedView,
  Image,
} from "@/tw";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronUp, CircleCheck, Gift, MapPinOff } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import Animated, { FadeIn, FadeOut, Layout, Easing, useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import { Dimensions } from "react-native";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import UserStoreHeroCarousel from "@/components/users/stores/user-store-hero-carousel";
import UserStreakCard from "@/components/rewards/user-streak-card";
import UserStampLogCard from "@/components/rewards/user-stamp-log-card";
import UpcomingProgramBanner from "@/components/rewards/upcoming-program-banner";
import RewardCard from "@/components/rewards/reward-card";
import SortPill from "@/components/rewards/sort-pill";
import { storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStoreOverviewData } from "@/hooks/use-store-overview-data";
import { ProgramSkeleton } from "@/components/skeleton/user/program-skeleton";
import StoreScreenContainer from "@/components/ui/store-screen-container";

const { width: screenWidth } = Dimensions.get("window");

const rewardSortOptions = [
  { id: "popular", labelKey: "popular" },
  { id: "points", labelKey: "points" },
  { id: "newest", labelKey: "newest" },
] as const;

export default function StoreOverviewDetail() {
  const { t: translate } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const storeId = params.storeId;

  const {
    rewardSort,
    rewardPointsOrder,
    setRewardSort,
    setRewardPointsOrder,
    isSwitchingStore,
    isNearbyOpen,
    setIsNearbyOpen,
    isStampLogOpen,
    setIsStampLogOpen,
    carouselIndex,
    heroIndex,
    setCarouselIndex,
    setHeroIndex,
    setIsSwitchingStore,
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
    isLoadingRewardsFeatures,
    fetchedStoreIds,
    refetchStreaks,
    upcomingStreak,
  } = useStoreOverviewData(storeId);

  // If a specific store is requested, we don't necessarily need to snap the carousel 
  // unless we want to show it in context. For now, let's keep it simple.
  
  const handleHeroSnap = useCallback((index: number) => {
    setHeroIndex(index);
    setIsSwitchingStore(true);
    setTimeout(() => setIsSwitchingStore(false), 400);
  }, [setHeroIndex, setIsSwitchingStore]);

  const isStoreCached = storeId ? fetchedStoreIds.includes(Number(storeId)) : false;

  // Immediately capture the first mounting frame without waiting for useEffect cycles
  const [isInitialLoading, setIsInitialLoading] = useState(!isStoreCached);

  useEffect(() => {
    if (!isStoreCached) {
      setIsInitialLoading(true);
      const timer = setTimeout(() => setIsInitialLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsInitialLoading(false);
    }
  }, [storeId, isStoreCached]);

  const claimScale = useSharedValue(1);
  const claimOpacity = useSharedValue(1);
  const claimScaleStyle = useAnimatedStyle(() => ({ opacity: claimOpacity.value, transform: [{ scale: claimScale.value }] }));
  const handleClaimPressIn = () => {
    claimScale.value = withSpring(0.96, { damping: 15, stiffness: 200, mass: 1 });
    claimOpacity.value = withTiming(0.7, { duration: 80 });
  };
  const handleClaimPressOut = () => {
    claimScale.value = withSpring(1, { damping: 15, stiffness: 200, mass: 1 });
    claimOpacity.value = withTiming(1, { duration: 80 });
  };

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
      <View className="flex-row items-center gap-x-4 mb-[-12px] z-50 pt-2 pl-2">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-1 -ml-1"
        >
          <ChevronLeft
            size={36}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View className="gap-y-0 -mt-16">
        <UserStoreHeroCarousel
          nearbyStores={storesWithLocation.filter(s => s.id.toString() === storeId)}
          storesWithLocation={storesWithLocation}
          setHeroIndex={handleHeroSnap}
          heroIndex={heroIndex}
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
                {nearbyStores.length > 0 ? (
                  <CircleCheck size={20} color="#FF6600" />
                ) : (
                  <MapPinOff size={20} color="#9ca3af" />
                )}
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
                isNearbyOpen ? (
                  <ChevronUp size={20} color="#FF6600" />
                ) : (
                  <ChevronDown size={20} color="#FF6600" />
                )
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
        {(isSwitchingStore || isInitialLoading || isLoadingRewardsFeatures) ? (
          // Skeleton shimmer while switching stores
          <ProgramSkeleton />
        ) : (
          <>
            {/* Generic empty state — only when NO programs at all (active OR upcoming) */}
            {displayStreaks.length === 0 && displayStamps.length === 0 && !upcomingStreak && (
              <AnimatedView
                entering={FadeIn.duration(400)}
                className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-8 items-center border border-neutral-100 dark:border-darkBorder mx-1 mb-3"
              >
                <CalendarDays size={40} color="#FF6600" />
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
                  height={155}
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
                      onStreakRecorded={refetchStreaks}
                    />
                  )}
                />
              </View>
            )}

            {/* Upcoming streak banner — shown below the active streak card if present,
                or alone when there is no active streak program */}
            {upcomingStreak && displayStreaks.length === 0 && (
              <View className="mb-3">
                <UpcomingProgramBanner
                  type="streak"
                  title={upcomingStreak.title}
                  startAt={upcomingStreak.start_at}
                  endDate={upcomingStreak.end_date}
                  programLength={upcomingStreak.streak_length}
                  description={upcomingStreak.reward_description}
                />
              </View>
            )}

            {displayStamps.length > 0 && (
              <View>
                <Carousel
                  width={screenWidth - 48}
                  height={isStampLogOpen ? 265 : 165}
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
          </>
        )}
      </View>

      <View className="gap-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
            {translate("user.rewards.rewardCatalog")}
          </Text>
          <Animated.View style={claimScaleStyle}>
            <Pressable
              onPressIn={handleClaimPressIn}
              onPressOut={handleClaimPressOut}
              className="flex-row items-center gap-x-1.5 bg-white dark:bg-darkBackgroundCard border border-primary px-3 py-1.5 rounded-full"
              onPress={() => {
                const found = storesWithLocation.find(s => s.id.toString() === storeId);
                router.push({ pathname: "/store/claim-rewards", params: { storeName: found?.name, storeLogo: found?.logo ?? "", storeAddress: found?.address ?? "" } });
              }}
            >
              <Gift size={14} color="#FF6600" />
              <Text className="text-primary font-poppins-semibold text-xs">
                {translate("user.rewards.buttons.claimRewards")}
              </Text>
            </Pressable>
          </Animated.View>
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
          {translate("label.poweredBy")}
        </Text>
      </View>
    </StoreScreenContainer>
  );
}
