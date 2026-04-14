import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, AnimatedView, TouchableOpacity, Image } from "@/tw";
import { Check, ExternalLink, Flame, Store } from "lucide-react-native";
import Animated, { Layout, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { storeLogos } from "@/data/rewards";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal as RNModal, Pressable, StyleSheet, View as RNView } from "react-native";
import { useRouter } from "expo-router";
import { recordUserStreak, getStreakEarnedDates } from "@/services/streak-service";
import { supabase } from "@/supabase/supabase";
import { Modal, type ModalButton } from "@/components/modal";

interface UserStreakCardProps {
  streak: any;
  nearbyStores: any[];
  isStoreNearby: (lat?: number | null, lon?: number | null) => boolean;
  onStreakRecorded?: () => void;
}

export default function UserStreakCard({
  streak,
  nearbyStores,
  isStoreNearby,
  onStreakRecorded,
}: UserStreakCardProps) {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasEarnedToday, setHasEarnedToday] = useState(false);
  // Per-day earned dates from DB — avoids the streak_days window bug where
  // non-consecutive earns (e.g. Wed ✓, Thu missed, Fri ✓) appear as "missed".
  const [earnedWeekDates, setEarnedWeekDates] = useState<Set<string>>(new Set());
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({
    visible: false,
    title: "",
    message: "",
  });
  const closeModal = () => setModalConfig((c) => ({ ...c, visible: false }));
  const showModal = (title: string, message: string, buttons?: ModalButton[]) =>
    setModalConfig({ visible: true, title, message, buttons });
  const storeStr = streak.stores as any;
  const storeName = storeStr?.name ?? translate("user.rewards.store");
  const storeAddress = storeStr?.address ?? translate("user.rewards.unknownLocation");
  const nearby =
    nearbyStores.some((s) => Number(s.id) === Number(streak.store_id)) ||
    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Derive if already earned today from last_activity_date
  // NOTE: This is DISPLAY-ONLY optimistic state. The authoritative "already earned"
  // check lives in the record_user_streak RPC (DB time, store timezone). Device
  // date is not trusted for eligibility. If the RPC returns alreadyRecorded: true,
  // we set hasEarnedToday=true so the UI reflects it immediately.
  const today = formatLocalDate(new Date()); // used only for calendar display
  const alreadyEarnedToday = streak.last_activity_date === today || hasEarnedToday;
  const shouldPulseCurrentDay = nearby && !alreadyEarnedToday;

  // Fetch real per-day earned dates from the DB.
  // Called on mount and after any successful streak recording so that the
  // weekly circles always reflect actual visit history, not just a consecutive window.
  const fetchEarnedDates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const dates = await getStreakEarnedDates(user.id, Number(streak.store_id));
      setEarnedWeekDates(dates);
    } catch {
      // silent: the fallback streak_days window (below) covers this case
    }
  }, [streak.store_id]);

  useEffect(() => {
    fetchEarnedDates();
  }, [fetchEarnedDates]);

  // Real data from backend
  const streakProgram = streak.store_streaks as any;
  const targetCount = streakProgram?.streak_length ?? 7;

  // ─── Week-scoped circle fill ─────────────────────────────────────────────
  // The 7 circles represent the CURRENT calendar week (Mon–Sun).
  // We only count days earned *this* week so that last week's progress never
  // bleeds into this week's circles and blocks today's "current" emphasis.

  // Today's weekday index: Mon=0, Tue=1 … Sun=6
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;

  // Monday 00:00 of the current week (local time, compared as date strings)
  const getMondayOfCurrentWeek = (): string => {
    const d = new Date();
    const offset = (d.getDay() + 6) % 7; // days since Monday
    d.setDate(d.getDate() - offset);
    return formatLocalDate(d); // "YYYY-MM-DD"
  };
  const weekStartStr = getMondayOfCurrentWeek(); // e.g. "2026-04-06" when today is Mon

  // ─── Accurate computation of exactly WHICH days are completed ───
  const addDays = (dateStr: string, d: number) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + d);
    return formatLocalDate(date);
  };

  const diffDays = (d1Str: string, d2Str: string) => {
    const [y1, m1, day1] = d1Str.split("-").map(Number);
    const [y2, m2, day2] = d2Str.split("-").map(Number);
    const d1 = new Date(y1, m1 - 1, day1);
    const d2 = new Date(y2, m2 - 1, day2);
    return Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
  };

  const lastActivityStr = streak.last_activity_date ?? "";
  let effectiveLastDateStr = lastActivityStr;
  let effectiveStreakDays = streak.streak_days ?? 0;

  // Optimistic bump if the user just earned today in this session
  if (hasEarnedToday && effectiveLastDateStr !== today) {
    const yesterdayStr = addDays(today, -1);
    if (effectiveLastDateStr === yesterdayStr) {
      effectiveStreakDays += 1;
    } else {
      effectiveStreakDays = 1; // broken streak
    }
    effectiveLastDateStr = today;
  }

  // ─── Program start boundary ─────────────────────────────────────────────────
  // IMPORTANT: Do NOT remove this. programStartStr is used below to distinguish
  // days that fall BEFORE the streak program began ("pre-program") from days
  // that are past-but-missed ("missed"). Without this, both states look the same.
  const programStartRaw = streakProgram?.start_at ?? null;
  let programStartStr: string | null = null;
  if (programStartRaw) {
    const d = new Date(programStartRaw);
    d.setHours(0, 0, 0, 0);
    programStartStr = formatLocalDate(d);
  }

  // Display value for subtitle and completion modal
  const clampedCount = Math.min(
    (streak.total_earned_days ?? streak.streak_days ?? 0) +
    (hasEarnedToday && lastActivityStr !== today ? 1 : 0),
    targetCount,
  );
  const totalEarnedDisplay = clampedCount;

  const streakDaysLabels = [
    translate("user.rewards.days.mon"),
    translate("user.rewards.days.tue"),
    translate("user.rewards.days.wed"),
    translate("user.rewards.days.thu"),
    translate("user.rewards.days.fri"),
    translate("user.rewards.days.sat"),
    translate("user.rewards.days.sun"),
  ];

  // ─── 5-State day classification — DO NOT simplify or collapse these states ──
  //
  //  STATE          WHEN                                 VISUAL
  //  "pre-program"  Day < program start_at               White bg + grey solid border
  //                 (e.g. Mon/Tue when program starts Wed) — signals "not part of program"
  //
  //  "completed"    Day is inside earned streak window   Orange fill + check icon + label
  //                 (last_activity_date window)          — signals a successfully earned day
  //
  //  "current"      Next unclaimed target day            Orange tint + dashed orange border + pulse
  //                 (today if not yet earned, or          — tappable to record a streak visit
  //                  tomorrow if today is already earned)
  //
  //  "missed"       Past in-program day, not earned      Grey fill + strikethrough label
  //                 (circleDateStr < today, not matched   — signals a skipped visit
  //                  by any of the above)
  //
  //  "upcoming"     Future in-program days beyond        Grey fill, no border
  //                 the next target                      — signals days still to come
  //
  // NOTE: "pre-program" and "upcoming" look different ON PURPOSE.
  //   pre-program = transparent + border  (excluded from program entirely)
  //   upcoming    = grey fill, no border  (part of program, just in the future)
  // ─────────────────────────────────────────────────────────────────────────────
  const days = Array.from({ length: 7 }, (_, index) => {
    const circleDateStr = addDays(weekStartStr, index);

    // ── 1. Before program start → pre-program (white bg, grey solid border) ──
    if (programStartStr && circleDateStr < programStartStr) {
      return { label: streakDaysLabels[index], state: "pre-program" as const };
    }

    // ── 2. Earned days ──
    // IMPORTANT: earnedWeekDates (real DB records) is the source of truth.
    // The streak_days window fallback is WRONG when there are gaps:
    //   e.g. Wed earned, Thu missed, Fri earned → streak_days=1 (only Fri),
    //   so diffDays(Fri, Wed)=2 ≥ streak_days=1 fails → Wed shows as "missed".
    // The hasEarnedToday flag covers the optimistic instant right after tapping.
    const isThisDayEarned =
      // Optimistic: user just earned today in this session (immediate UI)
      (hasEarnedToday && circleDateStr === today) ||
      // Real per-day data from DB (accurate for non-consecutive earns)
      (earnedWeekDates.size > 0 && earnedWeekDates.has(circleDateStr)) ||
      // Fallback: consecutive streak window (only used while earnedWeekDates loads)
      (earnedWeekDates.size === 0 &&
        effectiveLastDateStr !== "" &&
        (() => {
          const daysSinceCircle = diffDays(effectiveLastDateStr, circleDateStr);
          return daysSinceCircle >= 0 && daysSinceCircle < effectiveStreakDays;
        })());
    if (isThisDayEarned) {
      return { label: streakDaysLabels[index], state: "completed" as const };
    }

    // ── 3. Next-target emphasis ──
    // When today is already earned, highlight tomorrow as the next goal (no pulse).
    // When today is not yet earned, highlight today as the current goal (with pulse).
    if (alreadyEarnedToday && clampedCount < targetCount) {
      if (todayWeekdayIndex < 6 && index === todayWeekdayIndex + 1) {
        return { label: streakDaysLabels[index], state: "current" as const };
      }
    } else if (!alreadyEarnedToday && index === todayWeekdayIndex) {
      if (clampedCount >= targetCount) {
        return { label: streakDaysLabels[index], state: "upcoming" as const };
      }
      return { label: streakDaysLabels[index], state: "current" as const };
    }

    // ── 4. Past in-program day not earned → missed (grey fill + strikethrough) ──
    if (index < todayWeekdayIndex) {
      return { label: streakDaysLabels[index], state: "missed" as const };
    }

    // ── 5. Future days (in-program, beyond the next target) ──
    return { label: streakDaysLabels[index], state: "upcoming" as const };
  });

  const pressScale = useSharedValue(1);
  const modalOpacity = useSharedValue(0);
  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const pulseScale = useSharedValue(1);
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (shouldPulseCurrentDay) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [pulseScale, shouldPulseCurrentDay]);

  useEffect(() => {
    if (!showStreakModal) {
      modalOpacity.value = 0;
      return;
    }

    modalOpacity.value = withTiming(1, { duration: 180 });

    const fadeTimer = setTimeout(() => {
      modalOpacity.value = withTiming(0, { duration: 420 });
    }, 2080);

    const closeTimer = setTimeout(() => {
      setShowStreakModal(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [modalOpacity, showStreakModal]);

  const getLogoImage = (store: any) => {
    if (store.logo) {
      return { uri: store.logo };
    }
    if (store.id && storeLogos[store.id.toString()]) {
      return storeLogos[store.id.toString()];
    }
    // return require("../../assets/images/rewards/coffee-shop.png");
  };

  return (
    <AnimatedView
      layout={Layout.duration(300)}
      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden mx-1"
    >
      <View className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <View className="w-4 h-4 items-center justify-center -mt-1">
              <Flame size={16} color="#FF6600" />
            </View>
            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
              {translate("user.rewards.streakLog")}
            </Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            {nearby && (
              <View className="bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-x-1">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <Text className="text-[10px] font-poppins-semibold text-green-700 dark:text-green-400">
                  {translate("user.rewards.nearby")}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push(`/store/streaks?storeId=${streak.store_id}`)}
              className="px-2 py-1"
            >
              <View className="flex-row items-center gap-x-1">
                <Text className="text-primary text-xs font-poppins-semibold">
                  {translate("user.rewards.viewAll")}
                </Text>
                <ExternalLink size={12} color="#FF6600" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-x-3 mt-1.5">
          <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
            {storeStr?.logo || storeLogos[streak.store_id.toString()] ? (
              <Image
                source={getLogoImage({ ...storeStr, id: streak.store_id })}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <Store size={20} color="#FF6600" />
            )}
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-1 flex-wrap flex-1">
              <Text
                className="font-poppins-semibold text-neutral-900 dark:text-neutral-100"
                numberOfLines={1}
              >
                {storeName}
              </Text>
              <Text
                className="text-[10px] text-neutral-500 dark:text-neutral-400 font-poppins"
                numberOfLines={1}
              >
                • {storeAddress}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-[10px] font-poppins-medium text-neutral-400 mt-1">
          {translate("user.rewards.daysThisWeek", { current: totalEarnedDisplay, target: targetCount })}
        </Text>

        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2 px-1">
          {days.map((day, index) => {
            const isCompleted = day.state === "completed";
            const isCurrent   = day.state === "current";
            const isPreProg   = day.state === "pre-program";
            const isMissed    = day.state === "missed";



            return (
              <View key={`${day.label}-${index}`} className="items-center w-11">
                {isCurrent ? (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={() => {
                      pressScale.value = withSpring(0.92, { damping: 14, stiffness: 220 });
                    }}
                    onPressOut={() => {
                      pressScale.value = withSpring(1, { damping: 14, stiffness: 220 });
                    }}
                    onPress={async () => {
                      // Phase 1: client-side nearby gate only.
                      // Server-side location enforcement is deferred to Phase 2.
                      if (!nearby) {
                        showModal(
                          "Not Nearby",
                          "You need to be within range of this store to earn your streak.",
                          [{ label: "OK", onPress: closeModal, variant: "primary" }],
                        );
                        return;
                      }
                      // If already earned today (optimistic state), show feedback.
                      // The RPC will also block it server-side if the state is stale.
                      if (alreadyEarnedToday) {
                        showModal(
                          "Already Earned!",
                          "You've already earned your streak for today. Come back tomorrow!",
                          [{ label: "OK", onPress: closeModal, variant: "primary" }],
                        );
                        return;
                      }
                      const storeStreakId = streak.store_streak_id;
                      if (!storeStreakId) {
                        showModal(
                          "No Program",
                          "This store's streak program isn't fully set up yet.",
                          [{ label: "OK", onPress: closeModal, variant: "primary" }],
                        );
                        return;
                      }
                      try {
                        setIsRecording(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user?.id) return;
                        const result = await recordUserStreak(
                          user.id,
                          Number(streak.store_id),
                          storeStreakId,
                          streakProgram?.fixed_points_per_day ?? 0,
                          targetCount,
                        );
                        if (result.alreadyRecorded) {
                          showModal(
                            "Already Earned!",
                            "You've already earned your streak for today. Come back tomorrow!",
                            [{ label: "OK", onPress: closeModal, variant: "primary" }],
                          );
                        } else if (result.justCompleted) {
                          setHasEarnedToday(true);
                          setShowStreakModal(true);
                          onStreakRecorded?.();
                          fetchEarnedDates(); // sync per-day dots with real DB data
                          showModal(
                            "🎉 Streak Complete!",
                            `You've completed the full ${targetCount}-day streak! Your reward is on its way.`,
                            [{ label: "Awesome!", onPress: closeModal, variant: "primary" }],
                          );
                        } else {
                          setHasEarnedToday(true);
                          setShowStreakModal(true);
                          onStreakRecorded?.();
                          fetchEarnedDates(); // sync per-day dots with real DB data
                        }
                      } catch (e) {
                        console.error("Failed to record streak:", e);
                        showModal(
                          "Error",
                          "Something went wrong. Please try again.",
                          [{ label: "OK", onPress: closeModal, variant: "secondary" }],
                        );
                      } finally {
                        setIsRecording(false);
                      }
                    }}
                  >
                    <Animated.View style={[pressAnimatedStyle, shouldPulseCurrentDay && pulseAnimatedStyle]}>
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted"
                        style={{ borderWidth: 1.5, borderColor: "#FF6600", borderStyle: "dashed" }}
                      >
                        <Text className="text-primary font-poppins-semibold text-[10px]">{day.label}</Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                ) : (
                  // ─── Circle style per state ────────────────────────────────
                  // completed  → orange fill (bg-primary)
                  // pre-program → transparent + grey border  ← DIFFERENT from upcoming on purpose
                  //               signals days that predate the program (e.g. Mon/Tue when
                  //               program starts Wed). Must NOT share style with "upcoming".
                  // missed/upcoming → grey fill, no border
                  //               missed = past in-program day not visited (has strikethrough)
                  //               upcoming = future in-program day (plain grey)
                  // ──────────────────────────────────────────────────────────
                  <View
                    className={
                      isCompleted
                        ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
                        : isPreProg
                          ? "w-10 h-10 rounded-full bg-transparent border border-neutral-200 dark:border-darkBorder items-center justify-center"
                          : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center"
                    }
                  >
                    {/* completed: orange circle → check icon + day label */}
                    {isCompleted ? (
                      <View className="items-center justify-center">
                        <Check size={12} color="#FFFFFF" />
                        <Text className="text-white font-poppins-bold text-[8px] uppercase">
                          {day.label}
                        </Text>
                      </View>
                    ) : isMissed ? (
                      // missed: grey fill → label with an absolutely-positioned 2px
                      // strikethrough bar. textDecorationLine is intentionally NOT used
                      // because it renders too thin at small font sizes in React Native.
                      <RNView style={{ alignItems: "center", justifyContent: "center" }}>
                        <Text className="text-neutral-400 font-poppins-semibold text-[10px]">
                          {day.label}
                        </Text>
                        <RNView
                          style={{
                            position: "absolute",
                            height: 2,
                            left: 0,
                            right: 0,
                            backgroundColor: "#9ca3af",
                            borderRadius: 1,
                          }}
                        />
                      </RNView>
                    ) : (
                      // pre-program or upcoming: show label with appropriate text colour
                      <Text
                        className={
                          isPreProg
                            ? "text-neutral-300 dark:text-neutral-500 font-poppins-semibold text-[10px]"
                            : "text-neutral-400 font-poppins-semibold text-[10px]"
                        }
                      >
                        {day.label}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Modal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
      />

      <RNModal
        visible={showStreakModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setShowStreakModal(false)}
      >
        <Animated.View style={[styles.modalOverlay, modalAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStreakModal(false)} />
          <RNView style={styles.modalContent}>
            <LottieView
              source={require("../../assets/lottie/streak.json")}
              autoPlay
              loop
              style={{ width: 220, height: 220 }}
            />
            <Text className="text-center text-white font-poppins-bold text-3xl mt-4">
              {effectiveStreakDays} {effectiveStreakDays === 1 ? 'Day' : 'Days'} Streak!
            </Text>
            <Text className="text-center text-white/90 font-poppins-medium text-base mt-2">
              {`Day ${clampedCount} / Day ${targetCount}`}
            </Text>
          </RNView>
        </Animated.View>
      </RNModal>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
