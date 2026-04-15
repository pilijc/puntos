import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, View as RNView, useColorScheme, Dimensions } from "react-native";
import { View, Text, Image } from "@/tw";
import { ChevronLeft, Gift, Gem, Star, Lock, Trophy, Sparkles, CheckCircle2 } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
import { getRewards } from "@/services/reward-service";
import { getUserAvailablePoints } from "@/services/user/points-service";
import { supabase } from "@/supabase/supabase";
import { Reward } from "@/services/reward-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Static placeholder data ──────────────────────────────────────────────────
const STATIC_NEXT_TIER = 1000;

const STATIC_GALLERY = [
  { id: "g1", uri: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?fm=jpg&q=80&w=600" },
  { id: "g2", uri: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?fm=jpg&q=80&w=600" },
  { id: "g3", uri: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?fm=jpg&q=80&w=600" },
  { id: "g4", uri: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?fm=jpg&q=80&w=600" },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function ClaimRewardsScreen() {
  const { storeId, storeName, storeLogo, storeAddress } = useLocalSearchParams<{ storeId?: string; storeName?: string; storeLogo?: string; storeAddress?: string }>();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const progressPercent = Math.min((userPoints / STATIC_NEXT_TIER) * 100, 100);

  useEffect(() => {
    async function loadData() {
      if (!storeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);

      const [storeRewards, points] = await Promise.all([
        getRewards({ storeId: storeId as string, limit: 20 }),
        getUserAvailablePoints(user.id)
      ]);

      setRewards(storeRewards);
      setUserPoints(points);
      setIsLoading(false);
    }

    loadData();
  }, [storeId]);

  // Split into redeemable and insufficient
  const redeemable = rewards.filter(r => userPoints >= r.points_cost);
  const almost = rewards.filter(r => userPoints < r.points_cost)
    .map(r => ({ ...r, deficit: r.points_cost - userPoints }));

  // ── Theme tokens ──────────────────────────────────────────────────────────
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
              REWARD WALLET
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
                    {storeAddress || "REWARD WALLET"}
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
            Your balance
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
          <RNView style={{ alignItems: "center", paddingTop: 10, marginBottom: 4 }}>
            <RNView style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: dark ? "#525252" : "#E0E0E0" }} />
          </RNView>

          {/* ── Store Gallery Carousel ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(140).duration(380)} style={{ marginHorizontal: -16, gap: 8 }}>
            <Carousel
              width={SCREEN_WIDTH}
              height={190}
              data={STATIC_GALLERY}
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
              {STATIC_GALLERY.map((_, i) => (
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

          {/* ── Tier Progress ─────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(360)}
            style={{
              backgroundColor: tierBg,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <RNView style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <RNView style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Trophy size={15} color="#FF6600" />
                <Text className="text-sm font-poppins-bold text-neutral-800">Next Tier</Text>
              </RNView>
              <Text className="text-xs font-poppins-bold text-primary">
                {userPoints} / {STATIC_NEXT_TIER} pts
              </Text>
            </RNView>
            <RNView style={{ height: 8, backgroundColor: progTrack, borderRadius: 4, overflow: "hidden" }}>
              <RNView style={{ height: "100%", width: `${progressPercent}%`, backgroundColor: "#FF6600", borderRadius: 4 }} />
            </RNView>
            <Text style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF", fontFamily: "Poppins_400Regular" }}>
              {Math.max(0, STATIC_NEXT_TIER - userPoints)} pts until your next reward tier unlocks
            </Text>
          </Animated.View>

          {/* ── Redeem Now ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).duration(360)} style={{ gap: 10 }}>
            <RNView style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
              <Star size={14} color="#FF6600" fill="#FF6600" />
              <Text className="text-neutral-800 font-poppins-bold text-sm">
                Ready to Claim
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
                      onPress={() => {
                        router.push({
                          pathname: "/(user)/store/redemption-code",
                          params: {
                            rewardId: item.id.toString(),
                            storeId: storeId,
                            rewardTitle: item.title,
                            rewardDescription: item.description,
                            rewardImage: item.image_url,
                            pointsCost: item.points_cost.toString(),
                          },
                        });
                      }}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: "#FF6600",
                        paddingHorizontal: 14, paddingVertical: 7,
                        borderRadius: 99,
                      }}
                    >
                      <CheckCircle2 size={12} color="#FFFFFF" />
                      <Text className="text-white font-poppins-bold text-[11px]">Claim</Text>
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
                Almost There
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
                          {item.points_cost.toLocaleString()} needed
                        </Text>
                      </RNView>
                      <RNView style={{
                        backgroundColor: lockPillBg,
                        paddingHorizontal: 10, paddingVertical: 4,
                        borderRadius: 99,
                      }}>
                        <Text style={{ color: lockPillText, fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>
                          +{item.deficit} pts
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


          {/* ── Earn Tip ──────────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(360)}
            style={{
              backgroundColor: tipBg,
              borderWidth: 1, borderColor: tipBorder,
              borderRadius: 18,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <RNView style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: dark ? "#9A3412" : "#FFE4CC",
              alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={16} color="#FF6600" />
            </RNView>
            <RNView style={{ flex: 1 }}>
              <Text className="text-neutral-800 font-poppins-semibold text-xs">
                Earn more points
              </Text>
              <Text className="text-neutral-500 font-poppins text-[11px] mt-0.5">
                Scan the QR code at checkout on your next visit
              </Text>
            </RNView>
          </Animated.View>


          {/* Footer */}
          <RNView style={{ alignItems: "center", paddingTop: 4 }}>
            <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
              POWERED BY PUNTOS
            </Text>
          </RNView>
        </ScrollView>
      </Animated.View>
    </RNView>
  );
}
