import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  AnimatedView,
  Image,
} from "@/tw";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronUp, CircleCheck, ExternalLink, Gift, MapPinOff, ReceiptText } from "lucide-react-native";
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
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStoreOverviewData } from "@/hooks/use-store-overview-data";
import { useCurrentUserProfileQuery } from "@/hooks/user/rq/profile-queries";
import { useUserTransactionsQuery } from "@/hooks/user/rq/activity-queries";
import { useSingleTap } from "@/hooks/use-single-tap";
import { ProgramSkeleton } from "@/components/skeleton/user/program-skeleton";
import StoreScreenContainer from "@/components/ui/store-screen-container";
import { MuteStoreButton } from "@/components/users/stores/mute-store-button";
import { supabase } from "@/supabase/supabase";
import { getUserTransactionHistory } from "@/services/user/qr-service";

const { width: screenWidth } = Dimensions.get("window");

const rewardSortOptions = [
  { id: "popular", labelKey: "popular" },
  { id: "points", labelKey: "points" },
  { id: "newest", labelKey: "newest" },
] as const;

export default function StoreOverviewDetail() {
  const { t: translate } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const rawStoreId = params.storeId;
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;

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
  } = useRewardsUiStore();


  const router = useRouter();
  
  const handleBack = useSingleTap(() => router.back());
  const handleHistory = useSingleTap(() => router.push("/(user)/history"));
  const handleMap = useSingleTap(() => router.push("/"));
  const handleQR = useSingleTap(() => router.push({ pathname: "/(user)/qr", params: { from: "/(user)/store" } }));

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
    isLoadingRewards,
  } = useStoreOverviewData(storeId);

  const handleNavigateClaim = useSingleTap(() => {
    const found = storesWithLocation.find(s => s.id.toString() === storeId);
    router.push({
      pathname: "/store/claim-rewards",
      params: {
        storeId,
        storeName: found?.name,
        storeLogo: found?.logo ?? "",
        storeAddress: found?.address ?? ""
      }
    });
  });

  // If a specific store is requested, we don't necessarily need to snap the carousel 
  // unless we want to show it in context. For now, let's keep it simple.

  const handleHeroSnap = useCallback((index: number) => {
    setHeroIndex(index);
    setIsSwitchingStore(true);
    setTimeout(() => setIsSwitchingStore(false), 400);
  }, [setHeroIndex, setIsSwitchingStore]);

  const isStoreCached = storeId ? fetchedStoreIds.includes(Number(storeId)) : false;



  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);

  const { data: profileData } = useCurrentUserProfileQuery();
  const userId = profileData?.user?.id;

  // ── Store-specific transaction history ──
  const { 
    data: storeTransactions = [], 
    isLoading: loadingTx 
  } = useUserTransactionsQuery(userId, storeId);

  const onRefreshLocal = useCallback(async () => {
    setIsRefreshingLocal(true);
    try {
      // ⚠️ IMPORTANT: Pass numericStoreId as BOTH storeId AND nearbyStoreIds to handleRefresh.
      //
      // WHY: handleRefresh only calls fetchRewardsData (6 Supabase queries) when
      // nearbyStoreIds is provided. Without it, onRefreshLocal had to call fetchRewardsData
      // separately — creating ~8 duplicate concurrent queries on top of handleRefresh's own
      // refetchStamps + refetchStampRewards + refetchStreaks + fetchRewardsActivity + fetchActivity.
      // That's 15+ concurrent Supabase queries, which saturates the connection pool
      // and causes individual queries to queue for >15s, triggering the timeout.
      //
      // By passing nearbyStoreIds here, handleRefresh owns all the fetching.
      // onRefreshLocal awaits ONE promise (handleRefresh), which internally fans out
      // 8 queries via a single Promise.all — well within the connection limit.
      //
      // ⚠️ DO NOT re-add a separate refetchStreaks() call here — already inside handleRefresh.
      // ⚠️ DO NOT re-add a separate fetchRewardsData() call here — already inside handleRefresh
      //     when nearbyStoreIds is provided.
      const numericStoreId = storeId ? Number(storeId) : undefined;
      const nearbyIds = numericStoreId && !isNaN(numericStoreId) ? [numericStoreId] : [];
      await Promise.race([
        handleRefresh(storeId, nearbyIds),
        // ⚠️ IMPORTANT: Promise.race with timeout — DO NOT revert to bare await handleRefresh().
        //
        // WHY: try/finally only catches REJECTIONS, not HANGS.
        // If handleRefresh stalls indefinitely (network pause, Supabase cold start,
        // app backgrounded mid-refresh), the try block never completes and
        // setIsRefreshingLocal(false) is never called — spinner stuck forever.
        // Promise.race guarantees cleanup within 30s regardless.
        //
        // 30s timeout: accounts for Supabase cold start (~10-15s on free tier)
        // and slow mobile connections. Log as warn — this is a network condition,
        // not a code bug.
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("[StoreDetail] Refresh timed out after 30s")), 30_000)
        ),
      ]);
    } catch (error) {
      console.warn("[StoreDetail] Refresh did not complete in time:", error);
    } finally {
      // ⚠️ MUST be in finally — guaranteed to run whether try completes normally,
      // throws, or is cut short by the timeout sentinel above.
      setIsRefreshingLocal(false);
    }
  }, [handleRefresh, storeId]);


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
      edges={["top", "left", "right"]}
      topPadding={0}
      onTouchStart={handleCarouselInteraction}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingLocal}
          onRefresh={onRefreshLocal}
          tintColor="#FF6600"
          colors={["#FF6600"]}
        />
      }
    >
      <View className="flex-row items-center justify-between gap-x-4 mb-[-12px] z-50 px-2">
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          className="p-1 -ml-1 bg-black/30 rounded-full"
        >
          <ChevronLeft
            size={36}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <MuteStoreButton storeId={Number(storeId)} />
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
                    </View>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleQR}
                      className="px-3 py-1 rounded-full bg-primary"
                      disabled={isStamping}
                    >
                      {isStamping ? (
                        <ActivityIndicator size="small" color="#FF6600" />
                      ) : (
                        <Text className="text-[10px] font-poppins-semibold text-white">
                          {translate("user.rewards.buttons.stamp")}
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
        {(isSwitchingStore || (isLoadingRewardsFeatures && !isStoreCached)) ? (
          // Skeleton shimmer while switching stores OR loading a new store from scratch.
          // We DO NOT show the skeleton during background refreshes of already cached stores.
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
                  // ⚠️ DO NOT REMOVE panGestureHandlerProps — this is the fix for
                  // react-native-reanimated-carousel v4 stealing ALL touch events,
                  // including taps on inner TouchableOpacity circles in UserStreakCard.
                  // Without this, the streak day circles are completely untappable.
                  // activeOffsetX tells the carousel to only activate its swipe handler
                  // after ±10px of horizontal movement; plain taps fall through to children.
                  panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
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
                      onForceExpand={() => setIsStampLogOpen(true)}
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
              onPress={handleNavigateClaim}
            >
              <Gift size={14} color="#FF6600" />
              <Text className="text-primary font-poppins-semibold text-xs">
                {translate("user.rewards.buttons.claimRewards")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        <View className="gap-y-4">
          {isLoadingRewards ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="#FF6600" />
              <Text className="text-neutral-400 font-poppins text-sm mt-2">
                {translate("user.rewards.loading")}
              </Text>
            </View>
          ) : sortedRewards.length === 0 ? (
            <View className="items-center py-8 bg-white dark:bg-darkBackgroundMuted rounded-xl">
              <Gift size={40} color="#9CA3AF" />
              <Text className="text-neutral-500 font-poppins-semibold text-sm mt-3">
                {translate("user.rewards.noRewards")}
              </Text>
              <Text className="text-neutral-400 font-poppins text-xs mt-1 text-center px-4">
                {translate("user.rewards.noRewardsSubtitle")}
              </Text>
            </View>
          ) : (
            sortedRewards.slice(0, 3).map((item) => {
              const currentStore = storesWithLocation.find(s => s.id.toString() === storeId);
              return (
                <RewardCard
                  key={item.id}
                  reward={item}
                  storeName={currentStore?.name}
                  storeLocation={currentStore?.address}
                  storeLogo={currentStore?.logo ?? ""}
                />
              );
            })
          )}
        </View>
      </View>

      {/* ── Transactions Section ── */}
      <View className="gap-y-3">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
            {translate("user.rewards.transactions.title")}
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-x-1.5 bg-white dark:bg-darkBackgroundCard border border-primary px-3 py-1.5 rounded-full"
            onPress={handleHistory}
          >
            <Text className="text-primary font-poppins-semibold text-xs">
              {translate("user.rewards.transactions.seeAll")}
            </Text>
            <ExternalLink size={12} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {/* Transaction cards */}
        {loadingTx ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#FF6600" />
          </View>
        ) : storeTransactions.length === 0 ? (
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder items-center py-8 gap-y-2">
            <ReceiptText size={28} color="#d1d5db" />
            <Text className="text-xs font-poppins text-neutral-400 dark:text-darkTextSecondary">
              {translate("user.rewards.transactions.empty")}
            </Text>
          </View>
        ) : (
          <View className="gap-y-2">
            {storeTransactions.map((item: any) => (
              <View
                key={item.id}
                className="bg-white dark:bg-darkBackgroundCard rounded-2xl overflow-hidden"
                style={{ borderLeftWidth: 3, borderLeftColor: "#FF6600" }}
              >
                <View className="flex-row items-center pl-3 pr-4 py-3 gap-x-3">
                  {/* Icon badge */}
                  <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-primary/10 items-center justify-center flex-shrink-0">
                    <Text className="text-base">{item.icon ?? "🛒"}</Text>
                  </View>

                  {/* Type label + date/time */}
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[13px] font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary"
                    >
                      {translate(item.subtitle)}
                    </Text>
                    <Text className="text-[11px] font-poppins text-neutral-400 dark:text-darkTextSecondary mt-0.5">
                      {item.time
                        ? `${new Date(item.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${new Date(item.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                        : ""}
                    </Text>
                  </View>

                  {/* Points pill */}
                  <View className={`px-2.5 py-1 rounded-full ${item.positive ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-primary/10 dark:bg-primary/10"}`}>
                    <Text className={`text-sm font-poppins-bold ${item.positive ? "text-emerald-500" : "text-primary"}`}>
                      {item.points}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="items-center pt-4">
        <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
          {translate("label.poweredBy")}
        </Text>
      </View>
    </StoreScreenContainer>
  );
}
