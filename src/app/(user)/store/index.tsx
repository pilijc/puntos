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
import { FadeIn, FadeOut, Layout, Easing, useAnimatedStyle, withTiming, interpolate, useSharedValue, withRepeat, withSequence } from "react-native-reanimated";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { distance, point } from "@turf/turf";
import Carousel from "react-native-reanimated-carousel";
import { Dimensions } from "react-native";
import RewardCard from "@/components/rewards/RewardCard";
import SortPill from "@/components/rewards/SortPill";
import { rewards, storeLogos } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useStoreStore } from "@/store/store-store";
import { useAuthStore } from "@/store/auth-store";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import {
  addStamp,
  getActiveStampProgramRewards,
  getStoresWithEnabledActiveStampProgram,
  StampProgress,
  ActiveStampProgramReward,
  getStoresWithEnabledStreaks,
} from "@/services/stamp-service";
import { getStores } from "@/services/store-service";
import { supabase } from "@/supabase/supabase";
import { Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";

const { width: screenWidth } = Dimensions.get("window");

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
  const { stores, setStores } = useStoreStore();
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isStampLogOpen, setIsStampLogOpen] = useState(false);

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isStampLogOpen ? "180deg" : "0deg", {
            duration: 300,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
        },
      ],
    };
  }, [isStampLogOpen]);

  const { location, permissionStatus, startWatching, stopWatching, refreshLocation } = useLocation();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
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

  const storesWithLocation = useMemo(() => {
    return enrichStoresWithLocation(stores, location);
  }, [stores, location]);

  const nearbyStores = useMemo(
    () => storesWithLocation.filter((store) => store.isNearby),
    [storesWithLocation],
  );
  const featuredStore = nearbyStores[0] ?? storesWithLocation[0];
  const [eligibleNearbyStoreIds, setEligibleNearbyStoreIds] = useState<number[]>([]);
  const [enabledStampFeatureStoreIds, setEnabledStampFeatureStoreIds] = useState<number[]>([]);
  const [eligibleStreakStoreIds, setEligibleStreakStoreIds] = useState<number[]>([]);
  const [activeStampProgramRewards, setActiveStampProgramRewards] = useState<ActiveStampProgramReward[]>([]);

  const { sessionToken } = useAuthStore();
  const { stamps, refetch: refetchStamps } = useStamps();
  const { stampRewards, refetch: refetchStampRewards } = useStampRewards();

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

  useEffect(() => {
    let isCancelled = false;

    const loadEligibleNearbyStores = async () => {
      const nearbyIds = nearbyStores.map((store) => Number(store.id));
      if (nearbyIds.length === 0) {
        if (!isCancelled) {
          setEligibleNearbyStoreIds((prev) => (prev.length === 0 ? prev : []));
        }
        return;
      }

      const ids = await getStoresWithEnabledActiveStampProgram(nearbyIds);
      if (!isCancelled) {
        const nextIds = Array.from(new Set(ids.map((id) => Number(id)))).sort((a, b) => a - b);
        setEligibleNearbyStoreIds((prev) => {
          if (
            prev.length === nextIds.length &&
            prev.every((value, index) => value === nextIds[index])
          ) {
            return prev;
          }
          return nextIds;
        });
      }
    };

    loadEligibleNearbyStores();

    return () => {
      isCancelled = true;
    };
  }, [nearbyStores]);

  // Effect to load pure feature flags (enabled/disabled) for stamps
  useEffect(() => {
    let isCancelled = false;
    const loadStampFeatureFlags = async () => {
      const nearbyIds = nearbyStores.map((store) => Number(store.id));
      if (nearbyIds.length === 0) {
        if (!isCancelled) setEnabledStampFeatureStoreIds([]);
        return;
      }
      // Re-use streaks service logic but for stamps flag if needed, 
      // or just fetch all features for these stores
      const { data: featureRows } = await supabase
        .from("store_feature")
        .select("store_id, stamp_enabled")
        .in("store_id", nearbyIds);

      if (!isCancelled && featureRows) {
        const enabledIds = featureRows
          .filter((row: any) => row.stamp_enabled === true)
          .map((row: any) => Number(row.store_id));
        setEnabledStampFeatureStoreIds(enabledIds);
      }
    };
    loadStampFeatureFlags();
    return () => { isCancelled = true; };
  }, [nearbyStores]);

  // Reset hero index when nearby stores change to avoid out of bounds
  useEffect(() => {
    setHeroIndex(0);
  }, [nearbyStores.length]);

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
  }, [nearbyStores.length]);

  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: swipeIndicatorOpacity.value,
  }));

  const displayStamps = useMemo(() => {
    if (!location) return sortedStamps;

    // Strict Nearby Mode: If we are near ANY active store, focus ONLY on the one visible in the hero banner
    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      // Relaxed check: show if feature is ENABLED in store_feature, 
      // even if no active program row exists in store_stamps.
      const isEnabled = enabledStampFeatureStoreIds.includes(Number(focusedStore.id));
      if (!isEnabled) return []; // Will show "Upcoming Events" if displayStreaks is also empty

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

    // Away Mode: Show all stores the user has stamps with
    return sortedStamps;
  }, [sortedStamps, nearbyStores, eligibleNearbyStoreIds, location, heroIndex]);

  useEffect(() => {
    let isCancelled = false;

    const loadEligibleStreakStores = async () => {
      const storeIds = Array.from(
        new Set([
          ...displayStamps.map((stamp) => Number(stamp.store_id)),
          ...nearbyStores.map((store) => Number(store.id))
        ].filter((id) => !Number.isNaN(id))),
      );

      if (storeIds.length === 0) {
        if (!isCancelled) {
          setEligibleStreakStoreIds([]);
        }
        return;
      }

      const ids = await getStoresWithEnabledStreaks(storeIds);
      if (!isCancelled) {
        setEligibleStreakStoreIds(ids);
      }
    };

    loadEligibleStreakStores();

    return () => {
      isCancelled = true;
    };
  }, [displayStamps, nearbyStores]);

  useEffect(() => {
    let isCancelled = false;

    const loadActiveStampProgramRewards = async () => {
      const storeIds = Array.from(
        new Set(displayStamps.map((stamp) => Number(stamp.store_id)).filter((id) => !Number.isNaN(id))),
      );

      if (storeIds.length === 0) {
        if (!isCancelled) {
          setActiveStampProgramRewards([]);
        }
        return;
      }

      const programRewards = await getActiveStampProgramRewards(storeIds);
      if (!isCancelled) {
        setActiveStampProgramRewards(programRewards);
      }
    };

    loadActiveStampProgramRewards();

    return () => {
      isCancelled = true;
    };
  }, [displayStamps]);

  const displayStreaks = useMemo(() => {
    // If we are near ANY active store, we filter the streak log by the focused store too
    if (nearbyStores.length > 0) {
      const focusedStore = nearbyStores[heroIndex];
      if (!focusedStore) return [];

      const isEligible = eligibleStreakStoreIds.includes(Number(focusedStore.id));
      if (!isEligible) return [];

      // Important: Decouple from displayStamps filtering. 
      // We look at sortedStamps (which has real progress) or create a virtual entry.
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

    // Away Mode: Show all stores the user has stamps with that also have streaks enabled
    return displayStamps.filter((stamp) => eligibleStreakStoreIds.includes(Number(stamp.store_id)));
  }, [displayStamps, sortedStamps, eligibleStreakStoreIds, nearbyStores, heroIndex]);


  const [isStamping, setIsStamping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActiveStores(), refetchStamps(), refetchStampRewards(), refreshLocation()]);
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

  // Proximity helper for Stamp Logs
  const isStoreNearby = (storeLat?: number | null, storeLon?: number | null) => {
    if (!location || storeLat == null || storeLon == null) return false;
    const from = point([location.longitude, location.latitude]);
    const to = point([storeLon, storeLat]);
    const distKm = distance(from, to, { units: "kilometers" });

    return distKm <= 0.03;
  };

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
      // requestLocationPermission();
    }
  }, [permissionStatus]);

  // Actively watch user position strictly when the tab is actively focused
  useFocusEffect(
    useCallback(() => {
      refetchStamps();
      refetchStampRewards();
      fetchActiveStores();
      startWatching();

      return () => {
        stopWatching();
      };
    }, [permissionStatus.granted, fetchActiveStores, refetchStamps, refetchStampRewards])
  );

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-6"
        onTouchStart={handleCarouselInteraction}
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
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            Rewards
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/store/stores")}
            className="px-3 py-2 rounded-full border border-neutral-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted"
          >
            <Text className="text-xs font-poppins-semibold text-neutral-700 dark:text-darkTextSoft">
              VIEW STORES
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-y-0">
          <View className="-mx-6 overflow-hidden bg-neutral-300 h-64 relative">
            {nearbyStores.length > 0 ? (
              <Carousel
                width={screenWidth}
                height={256}
                data={nearbyStores}
                scrollAnimationDuration={1000}
                loop={nearbyStores.length > 1}
                autoPlay={false}
                autoPlayInterval={4000}
                onSnapToItem={(index) => setHeroIndex(index)}
                renderItem={({ item: store }) => (
                  <View className="w-full h-full relative">
                    <Image
                      source={
                        store.banner
                          ? { uri: store.banner }
                          : store.logo
                            ? { uri: store.logo }
                            : storeLogos[store.id.toString()]
                              ? storeLogos[store.id.toString()]
                              : require("../../../assets/images/rewards/coffee-shop.png")
                      }
                      className="absolute inset-0 w-full h-full"
                      contentFit="cover"
                      contentPosition="center"
                    />
                    <View className="absolute inset-0 bg-neutral-900/40" />

                    <View className="absolute bottom-20 left-6 right-6 z-10">
                      <Text className="text-2xl font-poppins-bold text-white" numberOfLines={1}>
                        {store.name}
                      </Text>

                      <View className="flex-col gap-y-1 mt-1">
                        <View
                          className="bg-white/20 px-2 py-0.5 self-start"
                          style={{ borderRadius: 8 }}
                        >
                          <Text className="text-[10px] text-white font-poppins-medium uppercase">{store.type || "Store"}</Text>
                        </View>
                        <View className="flex-row items-center gap-x-1">
                          <MaterialIcons name="place" size={14} color="#FFFFFF" />
                          <Text className="text-white/90 font-poppins text-xs flex-1" numberOfLines={1}>
                            {store.address || "Unknown Location"} • {store.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"} meters away
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              />
            ) : (
              <>
                <View className="absolute top-15 left-6 z-20">
                  <View className="bg-primary/90 self-start px-2 py-0.5 rounded-sm mb-2">
                    <Text className="text-[10px] text-white font-poppins-semibold tracking-wider">DISCOVER PARTNERS</Text>
                  </View>
                </View>
                <Carousel
                  width={screenWidth}
                  height={256} // h-64 = 256px
                  data={storesWithLocation.filter(s => s.is_active)}
                  scrollAnimationDuration={1500}
                  loop={true}
                  autoPlay={false}
                  autoPlayInterval={4000}
                  renderItem={({ item: store }) => (
                    <View className="w-full h-full relative">
                      <Image
                        source={
                          store.banner
                            ? { uri: store.banner }
                            : store.logo
                              ? { uri: store.logo }
                              : require("../../../assets/images/rewards/coffee-shop.png")
                        }
                        className="absolute inset-0 w-full h-full"
                        contentFit="cover"
                        contentPosition="center"
                      />
                      <View className="absolute inset-0 bg-neutral-900/40" />
                      {/* Store Tab View [when stores are nearby] */}
                      <View className="absolute top-22 left-6 right-6 z-10">
                        <Text className="text-2xl font-poppins-bold text-white" numberOfLines={1}>
                          {store.name}
                        </Text>

                        <View className="flex-col gap-y-1 mt-1">
                          <View
                            className="bg-white/20 px-2 py-0.5 self-start"
                            style={{ borderRadius: 8 }}
                          >
                            <Text className="text-[10px] text-white font-poppins-medium uppercase">{store.type || "Store"}</Text>
                          </View>
                          <View className="flex-row items-center gap-x-1">
                            <MaterialIcons name="storefront" size={14} color="#FFFFFF" />
                            <Text className="text-white/90 font-poppins text-xs flex-1" numberOfLines={1}>
                              {store.address}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </>
            )}

            <View className="absolute top-4 left-97 right-6 flex-row items-center justify-between z-10">
              {/* Blinking swipe indicator in place of share button */}
              {nearbyStores.length >= 2 && (
                <AnimatedView style={swipeIndicatorStyle}>
                  <MaterialIcons name="chevron-right" size={28} color="#FFFFFF" />
                </AnimatedView>
              )}
            </View>
          </View>

          <AnimatedView
            layout={Layout.duration(260).easing(Easing.out(Easing.cubic))}
            className="bg-white dark:bg-darkBackgroundCard rounded-2xl p-4 gap-y-3 -mt-6 mx-1"
          >
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setIsNearbyOpen((prev) => !prev)}
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
                      ? `${nearbyStores.length} stores are within range!`
                      : nearbyStores.length === 1
                        ? "You are within range!"
                        : "Not in range of any store"}
                  </Text>
                  <Text className="text-neutral-500 dark:text-neutral-400 text-[11px] font-poppins mt-1" numberOfLines={1}>
                    {nearbyStores.length > 0
                      ? "Make a purchase to earn a stamp"
                      : "Explore other branches"}
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
                    EXPLORE
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
                          <Text className="text-[9px] text-primary/80 font-poppins">
                            LOGO
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-neutral-900 dark:text-neutral-100 font-poppins-semibold">
                          {store.name}
                        </Text>
                        <Text className="text-neutral-500 dark:text-neutral-400 text-xs font-poppins mt-1">
                          {store.address} • {store.distanceMeters?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"} meters
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-x-2">
                      {/* STAMP button repurposed to open QR for purchase-based transactions */}
                      <TouchableOpacity
                        className={`px-3 py-1 rounded-full ${hasStampedToday(store.id) ? "bg-neutral-200 dark:bg-white/10" : "bg-primary"}`}
                        onPress={() => router.push("/qr")}
                        disabled={isStamping || hasStampedToday(store.id)}
                      >
                        {isStamping ? (
                          <ActivityIndicator size="small" color="#FF6600" />
                        ) : (
                          <Text className={`text-[10px] font-poppins-semibold ${hasStampedToday(store.id) ? "text-neutral-500" : "text-white"}`}>
                            {hasStampedToday(store.id) ? "STAMPED" : "STAMP"}
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
              className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-8 items-center border border-neutral-100 dark:border-darkBorder mx-1"
            >
              <MaterialIcons name="event-note" size={40} color="#FF6600" />
              <Text className="text-neutral-900 dark:text-white font-poppins-bold text-lg mt-3 text-center">
                Watch out for upcoming events!
              </Text>
              <Text className="text-neutral-500 text-center font-poppins text-xs mt-1 px-4">
                This store doesn't have active rewards right now. Check back soon for stamps and streaks!
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
                  const storeName = storeStr?.name ?? "Store";
                  const storeAddress = storeStr?.address ?? "Unknown Location";
                  const nearby = nearbyStores.some((s) => Number(s.id) === Number(streak.store_id)) ||
                    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

                  // Mocking streak progress for UI: use 3 days completed for now
                  const clampedCount = 3;
                  const targetCount = 7;
                  const streakDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
                    <AnimatedView
                      layout={Layout.duration(300)}
                      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden mx-1"
                    >
                      <View className="p-3">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-x-2">
                            <MaterialIcons name="local-fire-department" size={18} color="#FF6600" />
                            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
                              Streak Log
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-x-3">
                            {nearby && (
                              <View className="bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-x-1">
                                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <Text className="text-[10px] font-poppins-semibold text-green-700 dark:text-green-400">
                                  Nearby
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity
                              disabled={true}
                              className="px-2 py-1 opacity-50"
                            >
                              <Text className="text-primary text-xs font-poppins-semibold">
                                VIEW ALL
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-x-3 mt-1.5">
                          <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
                            {(storeStr?.logo || storeStr?.banner) ? (
                              <Image
                                source={{ uri: storeStr?.logo || storeStr?.banner }}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : storeLogos[streak.store_id.toString()] ? (
                              <Image
                                source={storeLogos[streak.store_id.toString()]}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : (
                              <MaterialIcons name="storefront" size={20} color="#FF6600" />
                            )}
                          </View>
                          <View className="flex-1 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-1 flex-wrap flex-1">
                              <Text className="font-poppins-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                                {storeName}
                              </Text>
                              <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 font-poppins" numberOfLines={1}>
                                • {storeAddress}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text className="text-[10px] font-poppins-medium text-neutral-400 mt-1">
                          {clampedCount}/{targetCount} DAYS THIS WEEK
                        </Text>

                        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2 px-1">
                          {days.map((day, index) => {
                            const isCompleted = day.state === "completed";
                            const isCurrent = day.state === "current";
                            const circleClass = isCompleted
                              ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
                              : isCurrent
                                ? "w-10 h-10 rounded-full items-center justify-center"
                                : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center";
                            const textClass = isCompleted || isCurrent
                              ? "text-primary font-poppins-semibold text-[10px]"
                              : "text-neutral-400 font-poppins-semibold text-[10px]";
                            return (
                              <View key={`${day.label}-${index}`} className="items-center w-11">
                                <View
                                  className={circleClass}
                                  style={isCurrent ? {
                                    borderWidth: 1.5,
                                    borderColor: "#FF6600",
                                    borderStyle: "dashed",
                                  } : undefined}
                                >
                                  {isCompleted ? (
                                    <View className="items-center justify-center">
                                      <MaterialIcons name="check" size={12} color="#FFFFFF" className="mb-0.5" />
                                      <Text className="text-white font-poppins-bold text-[8px] uppercase">{day.label}</Text>
                                    </View>
                                  ) : (
                                    <Text className={textClass}>{day.label}</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </AnimatedView>
                  );
                }}
              />
            </View>
          )}

          {displayStamps.length === 0 ? (
            /* Away Mode Placeholder */
            nearbyStores.length === 0 && (
              <View
                className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-6 items-center mx-1"
              >
                <MaterialIcons name="stars" size={32} color="#d1d5db" className="mb-2" />
                <Text className="text-neutral-500 font-poppins-semibold text-sm mt-2">No Active Stamps</Text>
                <Text className="text-neutral-400 font-poppins text-xs text-center mt-1">Visit a partner store to start your stamp log!</Text>
              </View>
            )
          ) : (
            <View>
              <Carousel
                width={screenWidth - 48}
                //Manually changed height to fit the content
                height={isStampLogOpen ? 250 : 150}
                data={displayStamps}
                scrollAnimationDuration={1000}
                enabled={displayStamps.length > 1}
                loop={displayStamps.length > 1}
                autoPlay={isAutoPlayEnabled && displayStamps.length > 1}
                autoPlayInterval={3000}
                onScrollStart={handleCarouselInteraction}
                onSnapToItem={(index) => setCarouselIndex(index)}
                renderItem={({ item: stamp }) => {
                  const stampReward = stampRewards.find((s) => s.store_id === stamp.store_id);
                  const activeProgramReward = activeStampProgramRewards.find(
                    (program) => program.store_id === Number(stamp.store_id),
                  );
                  // Source priority:
                  // 1) active stamp program target
                  // 2) stamp_progress
                  // 3) stamp_rewards fallback
                  // This keeps nearby virtual cards at 0 unless there is true progress.
                  const count = stamp.stamps_count ?? stampReward?.current_stamp_count ?? 0;
                  const targetCount = Math.max(
                    activeProgramReward?.total_stamps ?? stampReward?.target_stamps ?? stamp.target ?? 7,
                    1,
                  );
                  const clampedCount = Math.min(Math.max(count, 0), targetCount);

                  // Compute Nearby Status
                  const storeStr = stamp.stores as unknown as { latitude?: number; longitude?: number; name?: string; is_active?: boolean };
                  const storeName = storeStr?.name ?? "Store";
                  const storeAddress = (stamp.stores as any)?.address ?? "Unknown Location";
                  const nearby = nearbyStores.some((s) => Number(s.id) === Number(stamp.store_id)) ||
                    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

                  const days = Array.from({ length: targetCount }, (_, index) => ({
                    label: `Log ${index + 1}`,
                    number: index + 1,
                    state:
                      index < clampedCount
                        ? "completed"
                        : index === clampedCount && clampedCount < targetCount
                          ? "current"
                          : "upcoming",
                  }));

                  return (
                    <AnimatedView
                      layout={Layout.duration(300)}
                      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden mx-1"
                    >
                      <Pressable
                        onPress={() => setIsStampLogOpen((prev) => !prev)}
                        className="p-3"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-x-2">
                            <MaterialIcons name="stars" size={18} color="#FF6600" />
                            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
                              Stamp Log
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-x-3">
                            {nearby && (
                              <View className="bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-x-1">
                                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <Text className="text-[10px] font-poppins-semibold text-green-700 dark:text-green-400">
                                  Nearby
                                </Text>
                              </View>
                            )}
                            <AnimatedView style={chevronStyle}>
                              <MaterialIcons
                                name="expand-more"
                                size={22}
                                color="#FF6600"
                              />
                            </AnimatedView>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                router.push("/store/streaks");
                              }}
                              className="px-2 py-1"
                            >
                              <Text className="text-primary text-xs font-poppins-semibold">
                                VIEW ALL
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-x-3 mt-1.5">
                          <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
                            {((stamp.stores as any)?.logo || (stamp.stores as any)?.banner) ? (
                              <Image
                                source={{ uri: (stamp.stores as any)?.logo || (stamp.stores as any)?.banner }}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : storeLogos[stamp.store_id.toString()] ? (
                              <Image
                                source={storeLogos[stamp.store_id.toString()]}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : (
                              <MaterialIcons name="storefront" size={20} color="#FF6600" />
                            )}
                          </View>
                          <View className="flex-1 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-1 flex-wrap flex-1">
                              <Text className="font-poppins-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                                {storeName}
                              </Text>
                              <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 font-poppins" numberOfLines={1}>
                                • {storeAddress}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text className="text-[10px] font-poppins-medium text-neutral-400 mt-1">
                          {clampedCount}/{targetCount} COMPLETED
                        </Text>

                        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2">
                          {days.map((day, index) => {
                            const isCompleted = day.state === "completed";
                            const isCurrent = day.state === "current";
                            const circleClass = isCompleted
                              ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
                              : isCurrent
                                ? "w-10 h-10 rounded-full items-center justify-center"
                                : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center";
                            const textClass = isCompleted || isCurrent
                              ? "text-primary font-poppins-semibold text-sm"
                              : "text-neutral-400 font-poppins-semibold text-sm";
                            return (
                              <View key={`${day.label}-${index}`} className="items-center w-11">
                                <View
                                  className={circleClass}
                                  style={isCurrent ? {
                                    borderWidth: 1.5,
                                    borderColor: "#FF6600",
                                    borderStyle: "dashed",
                                  } : undefined}
                                >
                                  {isCompleted ? (
                                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                                  ) : (
                                    <Text className={textClass}>{day.number}</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>

                      </Pressable>

                      {isStampLogOpen && (
                        <AnimatedView
                          entering={FadeIn.duration(300)}
                          exiting={FadeOut.duration(200)}
                          layout={Layout.duration(250)}
                          className="px-3 pb-3 pt-1 border-t border-neutral-50 dark:border-darkBorder bg-neutral-50/10"
                        >
                          <View className="flex-row items-center justify-between border border-primary/10 bg-primary/5 dark:bg-primary/10 rounded-2xl p-3">
                            <View className="flex-row items-center gap-x-3 flex-1">
                              <View className="relative">
                                <View className="w-14 h-14 rounded-2xl bg-white dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-primary/5">
                                  <MaterialIcons name="monetization-on" size={28} color="#FF6600" />
                                </View>
                                {clampedCount >= targetCount && (
                                  <View className="absolute -top-1.5 -right-1.5 bg-green-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-darkBackgroundMuted">
                                    <MaterialIcons name="check" size={12} color="white" />
                                  </View>
                                )}
                              </View>
                              <View className="flex-1 ml-0.5">
                                <Text className="text-[10px] font-poppins-bold text-primary uppercase tracking-[1.2px] mb-0.5">
                                  {clampedCount >= targetCount ? "UNLOCKED!" : "REWARD"}
                                </Text>
                                <Text
                                  className="text-sm text-neutral-800 dark:text-neutral-100 font-poppins-bold"
                                  numberOfLines={1}
                                >
                                  500 Points
                                </Text>
                                <Text className="text-[10px] text-neutral-400 font-poppins mt-0.5" numberOfLines={1}>
                                  {clampedCount >= targetCount
                                    ? "Claim your points now!"
                                    : `${targetCount - clampedCount} stamps more to unlock`}
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              className={`px-4 py-2.5 rounded-xl ${clampedCount >= targetCount ? "bg-primary" : "bg-white dark:bg-darkBackgroundCard opacity-60"}`}
                              disabled={clampedCount < targetCount}
                              onPress={() => {
                                Alert.alert(
                                  "Claim Reward",
                                  `Ready to claim "${activeProgramReward?.reward_title}"? Please present this to the store staff.`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Claim Now", onPress: () => Alert.alert("Success", "Reward claimed! Please check your history.") }
                                  ]
                                );
                              }}
                            >
                              <Text className={`text-[11px] font-poppins-bold tracking-wider ${clampedCount >= targetCount ? "text-white" : "text-neutral-400"}`}>
                                CLAIM
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </AnimatedView>
                      )}
                    </AnimatedView>
                  );
                }}
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
