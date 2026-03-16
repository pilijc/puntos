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
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { FadeIn, FadeOut, Layout, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { distance, point } from "@turf/turf";
import Carousel from "react-native-reanimated-carousel";
import { Dimensions } from "react-native";
import UserStoreHeroCarousel from "@/components/stores/UserStoreHeroCarousel";
import UserStreakCard from "@/components/rewards/UserStreakCard";
import UserStampLogCard from "@/components/rewards/UserStampLogCard";
import RewardCard from "@/components/rewards/RewardCard";
import SortPill from "@/components/rewards/SortPill";
import { rewards, storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useRewardsDataStore } from "@/store/rewards-data-store";
import { useStoreStore } from "@/store/store-store";
import { useAuthStore } from "@/store/auth-store";
import { useLocation } from "@/hooks/use-location";
import { useRewardsActions } from "@/hooks/use-rewards-actions";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { getStores } from "@/services/store-service";
import { supabase } from "@/supabase/supabase";
import { Alert, ActivityIndicator, RefreshControl } from "react-native";
import { StampProgress } from "@/services/stamp-service";

const { width: screenWidth } = Dimensions.get("window");

const rewardSortOptions = [
  { id: "popular", label: "popular" },
  { id: "points", label: "points" },
  { id: "newest", label: "newest" },
] as const;

export default function Rewards() {
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
    heroIndex,
    setHeroIndex,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    isStamping,
    setIsStamping,
    refreshing,
    setRefreshing,
  } = useRewardsUiStore();

  const {
    eligibleNearbyStoreIds,
    enabledStampFeatureStoreIds,
    eligibleStreakStoreIds,
    activeStampProgramRewards,
    fetchRewardsData,
  } = useRewardsDataStore();

  const { stores, setStores } = useStoreStore();
  const router = useRouter();
  const { location, permissionStatus, startWatching, stopWatching, refreshLocation } = useLocation();
  const { handleRefresh, handleStamp, hasStampedToday } = useRewardsActions();
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActiveStores = useCallback(async () => {
    try {
      const data = await getStores();
      setStores(data ?? []);
    } catch (e) {
      console.error("Failed to load stores in Store tab:", e);
    }
  }, [setStores]);

  useEffect(() => {
    fetchActiveStores();
  }, [fetchActiveStores]);

  const handleCarouselInteraction = () => {
    setIsAutoPlayEnabled(false);
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlayEnabled(true);
    }, 15000);
  };

  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  const {
    getEnrichedStores,
  } = useRewardsDataStore();

  const storesWithLocation = useMemo(() => {
    return getEnrichedStores(stores, location);
  }, [stores, location, getEnrichedStores]);

  const nearbyStores = useMemo(
    () => storesWithLocation.filter((store) => store.isNearby),
    [storesWithLocation],
  );

  const { stamps } = useStamps();
  const { stampRewards } = useStampRewards();

  const sortedStamps = useMemo(() => {
    if (!location) return stamps;
    const userPt = point([location.longitude, location.latitude]);

    return [...stamps].sort((a, b) => {
      const storeA = a.stores as unknown as { latitude?: number; longitude?: number };
      const storeB = b.stores as unknown as { latitude?: number; longitude?: number };

      let distA = Infinity;
      let distB = Infinity;

      if (storeA?.latitude != null && storeA?.longitude != null) {
        distA = distance(userPt, point([storeA.longitude, storeA.latitude]), { units: "kilometers" });
      }

      if (storeB?.latitude != null && storeB?.longitude != null) {
        distB = distance(userPt, point([storeB.longitude, storeB.latitude]), { units: "kilometers" });
      }

      return distA - distB;
    });
  }, [stamps, location]);


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

  // Sync data whenever nearby stores change
  useEffect(() => {
    const nearbyIds = nearbyStores.map((store) => Number(store.id));
    const displayStampStoreIds = sortedStamps.map((stamp) => Number(stamp.store_id));
    
    fetchRewardsData(nearbyIds, displayStampStoreIds);
  }, [nearbyStores, sortedStamps, fetchRewardsData]);

  // Reset hero index when nearby stores change to avoid out of bounds
  useEffect(() => {
    setHeroIndex(0);
  }, [nearbyStores.length, setHeroIndex]);

  // Blinking swipe indicator animation
  const swipeIndicatorOpacity = useSharedValue(0);
  useEffect(() => {
    if (nearbyStores.length >= 2) {
      swipeIndicatorOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.2, { duration: 600 }),
        ),
        -1, // infinite
        true
      );
    } else {
      swipeIndicatorOpacity.value = 0;
    }
  }, [nearbyStores.length, swipeIndicatorOpacity]);

  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: swipeIndicatorOpacity.value,
  }));

  const isStoreNearby = useCallback((storeLat?: number | null, storeLon?: number | null) => {
    if (!location || storeLat == null || storeLon == null) return false;
    const from = point([location.longitude, location.latitude]);
    const to = point([storeLon, storeLat]);
    const distKm = distance(from, to, { units: "kilometers" });

    return distKm <= 0.03;
  }, [location]);

  const displayStamps = useMemo(() => {
    if (!location) return sortedStamps;

    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      const isEnabled = enabledStampFeatureStoreIds.includes(Number(focusedStore.id));
      if (!isEnabled) return [];

      const existing = sortedStamps.find((stamp) => Number(stamp.store_id) === Number(focusedStore.id));
      if (existing) return [existing];

      const virtualStamp: StampProgress = {
        id: -Number(focusedStore.id),
        user_id: "",
        store_id: Number(focusedStore.id),
        stamps_count: 0,
        target: 7,
        last_stamp_at: "",
        updated_at: "",
        stores: {
          name: focusedStore.name,
          logo: focusedStore.logo ?? undefined,
          status: focusedStore.status,
          is_active: focusedStore.is_active,
          latitude: focusedStore.latitude ?? undefined,
          longitude: focusedStore.longitude ?? undefined,
          address: focusedStore.address ?? undefined,
        },
      };
      return [virtualStamp];
    }

    return sortedStamps;
  }, [sortedStamps, nearbyStores, location, heroIndex, enabledStampFeatureStoreIds]);

  const displayStreaks = useMemo(() => {
    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      const isEligible = eligibleStreakStoreIds.includes(Number(focusedStore.id));
      if (!isEligible) return [];

      const existing = sortedStamps.find((stamp) => Number(stamp.store_id) === Number(focusedStore.id));
      if (existing) return [existing];

      const virtualEntry: StampProgress = {
        id: -Number(focusedStore.id),
        user_id: "",
        store_id: Number(focusedStore.id),
        stamps_count: 0,
        target: 7,
        last_stamp_at: "",
        updated_at: "",
        stores: {
          name: focusedStore.name,
          logo: focusedStore.logo ?? undefined,
          status: focusedStore.status,
          is_active: focusedStore.is_active,
          latitude: focusedStore.latitude ?? undefined,
          longitude: focusedStore.longitude ?? undefined,
          address: focusedStore.address ?? undefined,
        },
      };
      return [virtualEntry];
    }

    return displayStamps.filter((stamp) => eligibleStreakStoreIds.includes(Number(stamp.store_id)));
  }, [displayStamps, sortedStamps, eligibleStreakStoreIds, nearbyStores, heroIndex]);

  // Request location permission on mount if not granted
  useEffect(() => {
    if (!permissionStatus.granted && permissionStatus.canAskAgain) {
      // requestLocationPermission();
    }
  }, [permissionStatus]);

  // Actively watch user position strictly when the tab is actively focused
  useEffect(() => {
    startWatching();
    return () => {
      stopWatching();
    };
  }, [startWatching, stopWatching]);

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-6"
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
            {translate("rewards.title")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/store/stores")}
            className="px-3 py-2 rounded-full border border-neutral-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted"
          >
            <Text className="text-xs font-poppins-semibold text-neutral-700 dark:text-darkTextSoft">
              {translate("rewards.viewStores")}
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
                      ? translate("rewards.range.multiple", { count: nearbyStores.length })
                      : nearbyStores.length === 1
                        ? translate("rewards.range.single")
                        : translate("rewards.range.empty")}
                  </Text>
                  <Text className="text-neutral-500 dark:text-neutral-400 text-[11px] font-poppins mt-1" numberOfLines={1}>
                    {nearbyStores.length > 0
                      ? translate("rewards.range.promptNearby")
                      : translate("rewards.range.promptFar")}
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
                    {translate("rewards.explore")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  {/* TODO: Implement Purchase-Based Reward Button Here */}
                </View>
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
                  <View
                    key={store.id}
                    className="flex-row items-center justify-between"
                  >
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
                            LOGO
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-neutral-900 dark:text-neutral-100 font-poppins-semibold">
                          {store.name}
                        </Text>
                        <Text className="text-neutral-500 dark:text-neutral-400 text-xs font-poppins mt-1">
                          {store.address} • {translate("rewards.distanceMeters", { meters: store.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0" })}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-x-2">
                      {/* STAMP button repurposed to open QR for purchase-based transactions */}
                      <TouchableOpacity
                        className={`px-3 py-1 rounded-full ${hasStampedToday(Number(store.id)) ? "bg-neutral-200 dark:bg-white/10" : "bg-primary"}`}
                        onPress={() => router.push("/qr")}
                        disabled={isStamping || hasStampedToday(Number(store.id))}
                      >
                        {isStamping ? (
                          <ActivityIndicator size="small" color="#FF6600" />
                        ) : (
                          <Text className={`text-[10px] font-poppins-semibold ${hasStampedToday(Number(store.id)) ? "text-neutral-500" : "text-white"}`}>
                            {hasStampedToday(Number(store.id)) ? "STAMPED" : "STAMP"}
                          </Text>
                        )}
                      </TouchableOpacity>
                      {/* SKIP button removed as stamps are now transaction-based */}
                    </View>
                  </View>
                ))}
              </AnimatedView>
            )}
          </AnimatedView>
        </View>

        <View>
          {/* 1. Upcoming Events fallback for focused nearby store with no features */}
          {nearbyStores.length > 0 && displayStreaks.length === 0 && displayStamps.length === 0 && (
            <AnimatedView
              entering={FadeIn.duration(400)}
              className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-8 items-center border border-neutral-100 dark:border-darkBorder mx-1"
            >
              <MaterialIcons name="event-note" size={40} color="#FF6600" />
              <Text className="text-neutral-900 dark:text-white font-poppins-bold text-lg mt-3 text-center">
                {translate("rewards.upcomingEvents.title")}
              </Text>
              <Text className="text-neutral-500 text-center font-poppins text-xs mt-1 px-4">
                {translate("rewards.upcomingEvents.subtitle")}
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
                renderItem={({ item: streak }) => {
                  const storeStr = streak.stores as any;
                  const storeName = storeStr?.name ?? translate("rewards.store");
                  const storeAddress = storeStr?.address ?? translate("rewards.unknownLocation");
                  const nearby = nearbyStores.some((s) => Number(s.id) === Number(streak.store_id)) ||
                    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

                  // Mocking streak progress for UI: use 3 days completed for now
                  const clampedCount = 3;
                  const targetCount = 7;
                  const streakDays = [
                    translate("rewards.days.mon"),
                    translate("rewards.days.tue"),
                    translate("rewards.days.wed"),
                    translate("rewards.days.thu"),
                    translate("rewards.days.fri"),
                    translate("rewards.days.sat"),
                    translate("rewards.days.sun")
                  ];

                  const days = streakDays.map((label, index) => ({
                    label: label,
                    state:
                      index < clampedCount
                        ? "completed"
                        : index === clampedCount
                          ? "current"
                          : "upcoming",
                  }));

                  return (
                    <UserStreakCard 
                      key={streak.store_id}
                      streak={streak}
                      nearbyStores={nearbyStores}
                      isStoreNearby={isStoreNearby}
                    />
                  );
                }}
              />
            </View>
          )}

          {displayStamps.length === 0 ? (
            /* Away Mode Placeholder */
            nearbyStores.length === 0 && (
              <View
                className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-6 items-center mx-1"
              >
                <MaterialIcons name="stars" size={32} color="#d1d5db" className="mb-2" />
                <Text className="text-neutral-500 font-poppins-semibold text-sm mt-2">{translate("rewards.noActiveStamps")}</Text>
                <Text className="text-neutral-400 font-poppins text-xs text-center mt-1">{translate("rewards.visitStartStamps")}</Text>
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

              {/* Pagination Dots */}
              {displayStamps.length > 1 && (
                <View className="flex-row justify-center items-center gap-x-2 mt-1">
                  {displayStamps.map((_, i) => (
                    <View
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${carouselIndex === i
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
              {translate("rewards.rewardCatalog")}
            </Text>
            <TouchableOpacity className="flex-row items-center gap-x-1">
              <Text className="text-primary text-xs font-poppins-semibold">
                {translate("rewards.viewAll")}
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
                  label={translate(`rewards.filters.${option.id}`)}
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
        </View>

        <View className="items-center pt-4">
          <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
            {translate("rewards.footer")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
