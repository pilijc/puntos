import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View as RNView, useColorScheme, Dimensions } from "react-native";
import { View, Text, Image } from "@/tw";
import { ChevronLeft, Gift, Gem, Star, Lock, Trophy, Sparkles, CheckCircle2 } from "lucide-react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
import { getRewards } from "@/services/reward-service";
import { getUserAvailablePoints } from "@/services/user/points-service";
import { getStoreById } from "@/services/store-service";
import { listenToUserRedemptions } from "@/services/user/rewards-redemption";
import { supabase } from "@/supabase/supabase";
import { Reward } from "@/services/reward-service";
import { RedemptionDrawer } from "@/components/rewards/redemption-drawer";
import { useRedemptionCode } from "@/hooks/useRedemptionCode";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClaimRewardsScreen() {
  const { t: translate } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string; storeName?: string; storeLogo?: string; storeAddress?: string }>();
  const rawStoreId = params.storeId;
  const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
  const storeName = params.storeName;
  const storeLogo = params.storeLogo;
  const storeAddress = params.storeAddress;
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [gallery, setGallery] = useState<{ id: string, uri: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [cooldownRewards, setCooldownRewards] = useState<Set<string>>(new Set());
  const router = useRouter();
  const redemptionChannelRef = useRef<any | null>(null);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  useEffect(() => {
    async function loadData() {
      if (!storeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);

      const [storeRewards, points, storeData] = await Promise.all([
        getRewards({ storeId: storeId as string, limit: 20 }),
        getUserAvailablePoints(user.id, storeId),
        getStoreById(Number(storeId))
      ]);

      setRewards(storeRewards);
      setUserPoints(points);

      if (storeData?.store_pictures && storeData.store_pictures.length > 0) {
        setGallery(
          storeData.store_pictures.map((uri: string, i: number) => ({ id: `pic-${i}`, uri }))
        );
      }

      setIsLoading(false);
    }

    loadData();
  }, [storeId]);

  const {
    redemptionCode,
    status,
    timeRemaining,
    rateLimitType,
    rateLimitTimeRemaining,
    errorMessage,
    generateCode,
    cancelCode,
    resetCode,
  } = useRedemptionCode(
    selectedReward?.id?.toString(),
    storeId
  );

  const handleClaimReward = useCallback(async (reward: Reward) => {
    if (cooldownRewards.has(reward.id.toString())) {
      return; // Prevent claiming if in cooldown
    }
    setSelectedReward(reward);
    setDrawerVisible(true);
  }, [cooldownRewards]);

  const isGeneratingRedemption = drawerVisible && status === "loading";

  const isRewardClaimDisabled = useCallback((reward: Reward) => {
    return isGeneratingRedemption || cooldownRewards.has(reward.id.toString());
  }, [cooldownRewards, isGeneratingRedemption]);

  const refreshRewardsAndPoints = useCallback(async () => {
    if (!userId || !storeId) return;

    const [storeRewards, points] = await Promise.all([
      getRewards({ storeId: storeId as string, limit: 20 }),
      getUserAvailablePoints(userId, storeId),
    ]);

    setRewards(storeRewards);
    setUserPoints(points);
  }, [userId, storeId]);

  const refreshPoints = useCallback(async () => {
    if (!userId || !storeId) return;

    const points = await getUserAvailablePoints(userId, storeId);
    setUserPoints(points);
  }, [userId, storeId]);

  useFocusEffect(
    useCallback(() => {
      refreshRewardsAndPoints();
    }, [refreshRewardsAndPoints])
  );

  useEffect(() => {
    if (selectedReward && drawerVisible && status === "loading" && !redemptionCode) {
      generateCode();
    }
  }, [selectedReward, drawerVisible, redemptionCode, status, generateCode]);

  // Active codes reserve points, while cancelled/expired codes release them.
  useEffect(() => {
    if (status === "active") {
      refreshPoints();
    } else if (status === "redeemed" || status === "cancelled" || status === "expired") {
      refreshRewardsAndPoints();
    }
  }, [status, redemptionCode?.id, refreshPoints, refreshRewardsAndPoints]);

  // Cancel redemption
  const handleCancelRedemption = useCallback(() => {
    cancelCode();
  }, [cancelCode]);

  // Close drawer and reset
  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
     resetCode();
     
     // Add to cooldown set if rate limited
     if (status === "rate_limited" && selectedReward) {
       setCooldownRewards(prev => new Set(prev).add(selectedReward.id.toString()));
       // Remove from cooldown after time expires
       setTimeout(() => {
         setCooldownRewards(prev => {
           const newSet = new Set(prev);
           newSet.delete(selectedReward.id.toString());
           return newSet;
         });
       }, rateLimitTimeRemaining * 1000);
     }
     
     // Refresh rewards and points after closing drawer
     if (status === "redeemed" || status === "cancelled" || status === "expired") {
       refreshRewardsAndPoints();
     }
     
     setTimeout(() => {
      setSelectedReward(null);
    }, 300);
  }, [resetCode, status, selectedReward, rateLimitTimeRemaining, refreshRewardsAndPoints]);

  useEffect(() => {
    if (!userId || !storeId) return;

    redemptionChannelRef.current = listenToUserRedemptions(
      userId,
      (redemption) => {
        Promise.all([
          getRewards({ storeId: storeId as string, limit: 20 }),
          getUserAvailablePoints(userId, storeId),
        ]).then(([storeRewards, points]) => {
          setRewards(storeRewards);
          setUserPoints(points);
        });
      }
    );

    return () => {
      if (redemptionChannelRef.current) {
        redemptionChannelRef.current.unsubscribe();
      }
    };
  }, [userId, storeId]);

  const redeemable = rewards.filter(r => userPoints >= r.points_cost);
  const almost = rewards.filter(r => userPoints < r.points_cost)
    .map(r => ({ ...r, deficit: r.points_cost - userPoints }));

  const heroBg = dark ? "#171717" : "#F3F4F6";
  const heroText = dark ? "#FFFFFF" : "#1C1C1E";
  const heroSub = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  const backBtn = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const backIcon = dark ? "#FFFFFF" : "#1C1C1E";
  const sheetBg = dark ? "#171717" : "#F3F4F6";
  const cardBg = dark ? "#404040" : "#FFFFFF";
  const tipBg = dark ? "#431407" : "#FFF8F4";
  const tipBorder = dark ? "#9A3412" : "#FFE4CC";
  const tierBg = dark ? "#404040" : "#FFFFFF";
  const handleBg = dark ? "#525252" : "#E0E0E0";
  const progTrack = dark ? "rgba(255,255,255,0.1)" : "#F0F0F0";
  const lockPillBg = dark ? "rgba(255,255,255,0.1)" : "#F3F4F6";
  const lockPillText = dark ? "#A3A3A3" : "#9CA3AF";
  const lockProgFill = dark ? "rgba(255,255,255,0.2)" : "#D1D5DB";

  return (
    <RNView style={{ flex: 1, backgroundColor: heroBg }}>

      {/* ── Dark Hero ────────────────────────────────────────────────────── */}
      <RNView style={{ paddingTop: insets.top, paddingBottom: 64, paddingHorizontal: 20 }}>

        {/* Nav row */}
        <RNView style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: backBtn,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} color={backIcon} />
          </TouchableOpacity>
          <RNView style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: heroSub, fontFamily: "Poppins_400Regular", fontSize: 11, letterSpacing: 2 }}>
              {translate("user.rewards.claimRewards.rewardWallet")}
            </Text>
          </RNView>
          <RNView style={{ width: 36 }} />
        </RNView>

        {/* Ambient glow ring + points */}
        <RNView style={{ alignItems: "center" }}>
          {/* Soft glow rings for depth */}
          <RNView
            style={{
              position: "absolute",
              width: 410, height: 410,
              borderTopLeftRadius: 205, borderTopRightRadius: 205,
              borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
              backgroundColor: "#FF6600",
              opacity: dark ? 0.06 : 0.05,
              top: -20,
            }}
          />
          <RNView
            style={{
              position: "absolute",
              width: 350, height: 350,
              borderTopLeftRadius: 175, borderTopRightRadius: 175,
              borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
              backgroundColor: "#FF6600",
              opacity: dark ? 0.09 : 0.07,
              top: 27,
            }}
          />

          {/* Store identity block */}
          {storeName ? (
            <Animated.View entering={FadeInDown.delay(60).duration(380)} style={{ alignItems: "center", marginBottom: 6, gap: 8 }}>
              {/* Logo circle */}
              <RNView
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
                  borderWidth: 1.5,
                  borderColor: dark ? "rgba(255,102,0,0.25)" : "rgba(255,102,0,0.18)",
                  alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  marginTop: -10, marginBottom: -10,
                }}
              >
                {storeLogo ? (
                  <Image
                    source={{ uri: storeLogo }}
                    style={{ width: 72, height: 72, padding: 6 }}
                    contentFit="contain"
                  />
                ) : (
                  <Gift size={22} color="#FF6600" />
                )}
              </RNView>
              {/* Store name + context */}
              <RNView style={{ alignItems: "center", gap: 2 }}>
                <Text style={{ color: heroText, fontFamily: "Poppins-Bold", fontSize: 15, letterSpacing: 0.2 }}>
                  {storeName}
                </Text>
                <RNView style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <RNView style={{ width: 16, height: 1, backgroundColor: "rgba(255,102,0,0.3)" }} />
                  <Text style={{ color: "#FF6600", fontFamily: "Poppins-Medium", fontSize: 9, letterSpacing: 1.4 }}>
                    {storeAddress || translate("user.rewards.claimRewards.rewardWallet")}
                  </Text>
                  <RNView style={{ width: 16, height: 1, backgroundColor: "rgba(255,102,0,0.3)" }} />
                </RNView>
              </RNView>
            </Animated.View>
          ) : null}

          {/* Points */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <RNView style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
              <Text
                style={{ fontSize: 36, lineHeight: 40, color: heroText, fontFamily: "Poppins-Bold" }}
              >
                {userPoints.toLocaleString()}
              </Text>
              <RNView style={{ marginBottom: 8, marginLeft: 2 }}>
                <Gem size={26} color="#FF6600" fill="rgba(255,102,0,0.15)" />
              </RNView>
            </RNView>
          </Animated.View>
          <Text style={{ color: heroSub, fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 4 }}>
            {translate("user.rewards.claimRewards.yourBalance")}
          </Text>
        </RNView>
      </RNView>

      {/* ── Content Sheet (slides over dark hero) ───────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(420)}
        style={{
          flex: 1,
          backgroundColor: sheetBg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          marginTop: -40,
          overflow: "hidden",
        }}
      >

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 60, gap: 16 }}
        >
          {/* ── Drag handle */}
          <RNView style={{ alignItems: "center", paddingTop: 10, marginBottom: -10 }}>
            <RNView style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: dark ? "#525252" : "#E0E0E0" }} />
          </RNView>

          {/* ── Store Gallery Carousel ───────────────────────────────── */}
          {gallery.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(380)} style={{ marginHorizontal: -16, gap: 8 }}>
              <Carousel
                width={SCREEN_WIDTH}
                height={190}
                data={gallery}
                autoPlay
                autoPlayInterval={3200}
                scrollAnimationDuration={800}
                loop
                onSnapToItem={setGalleryIndex}
                mode="parallax"
                modeConfig={{ parallaxScrollingScale: 0.88, parallaxScrollingOffset: 48 }}
                renderItem={({ item }) => (
                  <RNView style={{ flex: 1, borderRadius: 18, overflow: "hidden", marginHorizontal: 8 }}>
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                    {/* Bottom gradient overlay (layered views) */}
                    <RNView style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, backgroundColor: "rgba(0,0,0,0.28)", borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
                    <RNView style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "rgba(0,0,0,0.18)", borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
                  </RNView>
                )}
              />
              {/* Dot indicators */}
              <RNView style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
                {gallery.map((_, i) => (
                  <RNView
                    key={i}
                    style={{
                      height: 6,
                      width: galleryIndex === i ? 18 : 6,
                      borderRadius: 3,
                      backgroundColor: galleryIndex === i ? "#FF6600" : (dark ? "#525252" : "#D1D5DB"),
                    }}
                  />
                ))}
              </RNView>
            </Animated.View>
          )}

          {/* ── Replacement Content ── */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(360)}
            style={{
              backgroundColor: tierBg,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <RNView style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <RNView style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: dark ? "#9A3412" : "#FFE4CC",
                alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={16} color="#FF6600" />
              </RNView>
              <RNView style={{ flex: 1 }}>
                <Text className="text-neutral-800 font-poppins-semibold text-xs">
                  {translate("user.rewards.claimRewards.earnMorePoints")}
                </Text>
                <Text className="text-neutral-500 font-poppins text-[11px] mt-0.5">
                  {translate("user.rewards.claimRewards.scanQrCode")}
                </Text>
              </RNView>
            </RNView>
          </Animated.View>

          {/* ── Redeem Now ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).duration(360)} style={{ gap: 10 }}>
            <RNView style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
              <Star size={14} color="#FF6600" fill="#FF6600" />
              <Text className="text-neutral-800 font-poppins-bold text-sm">
                {translate("user.rewards.claimRewards.readyToClaim")}
              </Text>
              <RNView style={{
                backgroundColor: "#FF6600", borderRadius: 99,
                paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <Text className="text-white font-poppins-bold text-[10px]">
                  {redeemable.length}
                </Text>
              </RNView>
            </RNView>

            {redeemable.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(300 + i * 80).duration(360)}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 18,
                  flexDirection: "row",
                  overflow: "hidden",
                }}
              >
                {/* Image */}
                <RNView style={{ width: 96, height: 96 }}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                </RNView>

                {/* Content */}
                <RNView style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, justifyContent: "space-between" }}>
                  <RNView>
                    <Text className="font-poppins-bold text-neutral-900 text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-neutral-400 font-poppins text-[11px] mt-0.5" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </RNView>
                  <RNView style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <RNView style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Gem size={11} color="#FF6600" fill="rgba(255,102,0,0.12)" />
                      <Text className="text-primary font-poppins-bold text-xs">
                        {item.points_cost.toLocaleString()}
                      </Text>
                    </RNView>
                    <TouchableOpacity
                      onPress={() => handleClaimReward(item)}
                      disabled={isRewardClaimDisabled(item)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: isRewardClaimDisabled(item) ? "#D1D5DB" : "#FF6600",
                        paddingHorizontal: 14, paddingVertical: 7,
                        borderRadius: 99,
                        opacity: isRewardClaimDisabled(item) ? 0.6 : 1,
                      }}
                    >
                      <CheckCircle2 size={12} color={isRewardClaimDisabled(item) ? "#6B7280" : "#FFFFFF"} />
                      <Text className={isRewardClaimDisabled(item) ? "text-neutral-500 font-poppins-bold text-[11px]" : "text-white font-poppins-bold text-[11px]"}>
                        {isGeneratingRedemption
                          ? translate("user.rewards.redemption.generating")
                          : cooldownRewards.has(item.id.toString())
                            ? "Wait"
                            : translate("user.rewards.streakDetail.claimBtn")}
                      </Text>
                    </TouchableOpacity>
                  </RNView>
                </RNView>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Almost There ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(460).duration(360)} style={{ gap: 10 }}>
            <RNView style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
              <Lock size={14} color="#9CA3AF" />
              <Text className="text-neutral-400 font-poppins-bold text-sm">
                {translate("user.rewards.claimRewards.almostThere")}
              </Text>
            </RNView>

            {almost.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(520 + i * 80).duration(360)}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 18,
                  flexDirection: "row",
                  overflow: "hidden",
                  opacity: 0.65,
                }}
              >
                {/* Image with lock */}
                <RNView style={{ width: 96, height: 96 }}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: 96, height: 96, opacity: 0.35 }}
                    contentFit="cover"
                  />
                  <RNView style={{
                    position: "absolute", inset: 0,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <RNView style={{
                      width: 34, height: 34, borderRadius: 17,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Lock size={14} color="#FFFFFF" />
                    </RNView>
                  </RNView>
                </RNView>

                {/* Content */}
                <RNView style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, justifyContent: "space-between" }}>
                  <RNView>
                    <Text className="font-poppins-bold text-neutral-500 text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-neutral-400 font-poppins text-[11px] mt-0.5" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </RNView>
                  <RNView style={{ gap: 6 }}>
                    <RNView style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <RNView style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Gem size={11} color="#9CA3AF" />
                        <Text className="text-neutral-400 font-poppins-semibold text-xs">
                          {translate("user.rewards.claimRewards.needed", { count: item.points_cost.toLocaleString() })}
                        </Text>
                      </RNView>
                      <RNView style={{
                        backgroundColor: lockPillBg,
                        paddingHorizontal: 10, paddingVertical: 4,
                        borderRadius: 99,
                      }}>
                        <Text style={{ color: lockPillText, fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>
                          {translate("user.rewards.claimRewards.ptsDeficit", { count: item.deficit })}
                        </Text>
                      </RNView>
                    </RNView>
                    {/* Progress bar */}
                    <RNView style={{ height: 4, backgroundColor: progTrack, borderRadius: 2, overflow: "hidden" }}>
                      <RNView style={{
                        height: "100%", borderRadius: 2,
                        backgroundColor: lockProgFill,
                        width: `${Math.round(((item.points_cost - item.deficit) / item.points_cost) * 100)}%`,
                      }} />
                    </RNView>
                  </RNView>
                </RNView>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Footer */}
          <RNView style={{ alignItems: "center", paddingTop: 4 }}>
            <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
              {translate("label.poweredBy")}
            </Text>
          </RNView>
        </ScrollView>
      </Animated.View>

      {/* Redemption Drawer */}
      <RedemptionDrawer
        visible={drawerVisible}
        rewardTitle={selectedReward?.title}
        rewardDescription={selectedReward?.description}
        rewardImage={selectedReward?.image_url}
        redemptionCode={redemptionCode ?? undefined}
        timeRemaining={timeRemaining}
        status={status}
        errorMessage={errorMessage}
        rateLimitType={rateLimitType}
        rateLimitTimeRemaining={rateLimitTimeRemaining}
        onClose={handleCloseDrawer}
        onCancel={handleCancelRedemption}
      />
    </RNView>
  );
}
