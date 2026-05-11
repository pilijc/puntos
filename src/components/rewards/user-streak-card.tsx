import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, AnimatedView, TouchableOpacity, Image } from "@/tw";
import { Check, ExternalLink, Flame, Store } from "lucide-react-native";
import Animated, { Easing, Layout, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { storeLogos } from "@/data/rewards";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal as RNModal, Pressable, StyleSheet, View as RNView } from "react-native";
import { useRouter } from "expo-router";
import { recordUserStreak, getStreakEarnedDates, STREAK_NEW_ENROLLMENT_BLOCKED } from "@/services/streak-service";
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
  // Cached on mount — never await getUser() inside the press handler (adds ~300ms delay)
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);
  // ⚠️  WARNING — AI / DEVELOPER: DO NOT REMOVE OR SIMPLIFY THIS STATE ⚠️
  // earnedWeekDates holds real per-day earned dates fetched from the DB.
  // It is the ONLY correct source of truth for the weekly circle states.
  // The streak_days integer fallback below is intentionally kept only as a
  // loading-skeleton fallback and is WRONG for non-consecutive visit patterns:
  //   e.g.  Wed ✓ → Thu missed → Fri ✓
  //   streak_days = 1  (only Fri counts as consecutive)
  //   diffDays(Fri, Wed) = 2 ≥ streak_days=1  → Wed incorrectly shows as "missed"
  // Without this Set, previously-earned circles flash to "missed" on re-render.
  // If you remove this state you WILL break the circle history display. — PUNTOS team
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

  // ⚠️  WARNING — AI / DEVELOPER: DO NOT REPLACE THIS WITH SERVER-SIDE DATE ⚠️
  // `today` is derived from the DEVICE clock and is used ONLY for calendar display
  // (deciding which circle is the "current" day visually).
  // The authoritative "already earned today" gate is inside the record_user_streak
  // RPC which runs on DB time in the store's own timezone — device date is NOT
  // trusted for reward eligibility. If the RPC returns alreadyRecorded:true we
  // set hasEarnedToday=true for immediate optimistic UI feedback.
  // Do NOT merge hasEarnedToday into a single server-driven state; they serve
  // different purposes (optimistic UI vs authoritative eligibility). — PUNTOS team
  const today = formatLocalDate(new Date()); // used only for calendar display
  const alreadyEarnedToday = streak.last_activity_date === today || hasEarnedToday;
  const shouldPulseCurrentDay = nearby && !alreadyEarnedToday;

  // Fetch real per-day earned dates from the DB.
  // Called on mount and after any successful streak recording so that the
  // weekly circles always reflect actual visit history, not just a consecutive window.
  const fetchEarnedDates = useCallback(async () => {
    // ⚠️ Guard: skip if store_streak_id is null.
    // On initial load, the streak entry may be a virtual (0-progress) record built before
    // activeStreakProgramMap has finished loading. At that point store_streak_id = null.
    // Querying without a streak ID would return dates from ALL past programs for this store,
    // causing incorrect circles to flash briefly. We wait for the real program ID to arrive
    // (deps change → useCallback recreates → useEffect re-fires with the correct ID).
    if (!streak.store_streak_id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      // Scope to the current program so old program events don't contaminate circles.
      const dates = await getStreakEarnedDates(user.id, Number(streak.store_id), streak.store_streak_id);
      setEarnedWeekDates(dates);
    } catch {
      // silent: the fallback streak_days window (below) covers this case
    }
  }, [streak.store_id, streak.store_streak_id]);

  useEffect(() => {
    fetchEarnedDates();
  }, [fetchEarnedDates]);

  // Cache the user ID once on mount so the press handler has it synchronously.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setCachedUserId(user.id);
    });
  }, []);

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

  // ─── Program start & end boundaries ────────────────────────────────────────
  // ⚠️  WARNING — AI / DEVELOPER: DO NOT REMOVE programStartStr OR programEndStr ⚠️
  //
  // These two strings are the ONLY thing that separates the "pre-program" circle
  // state from the "missed" circle state. They look identical at first glance but
  // have completely different meanings and visuals:
  //
  //   pre-program  → day predates or postdates the active program window
  //                  → transparent bg + grey solid border  (excluded from program)
  //   missed       → day is inside the program window but the user didn't visit
  //                  → grey fill + strikethrough label     (a skipped visit)
  //
  // If you delete programStartStr / programEndStr ALL days before the program
  // started will incorrectly show as "missed" visits, confusing users.
  // This was previously broken and deliberately fixed — do not revert. — PUNTOS team
  const programStartRaw = streakProgram?.start_at ?? null;
  let programStartStr: string | null = null;
  if (programStartRaw) {
    const d = new Date(programStartRaw);
    d.setHours(0, 0, 0, 0);
    programStartStr = formatLocalDate(d);
  }

  // programEndStr: days AFTER this date are also "pre-program" (outside the program window).
  // end_date is a "YYYY-MM-DD" string from the DB (set at creation time as start_at + max_days_cap).
  const programEndStr: string | null = streakProgram?.end_date ?? null;

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

  // ════════════════════════════════════════════════════════════════════════════
  // ⚠️  AI / DEVELOPER WARNING — DO NOT SIMPLIFY, MERGE, OR DELETE THESE STATES
  // ════════════════════════════════════════════════════════════════════════════
  //
  // The 7 weekly circles each hold ONE of 5 distinct states. All 5 are required.
  // They were carefully designed after multiple bug reports — do not collapse them.
  //
  //  STATE          WHEN                                      VISUAL
  //  ─────────────────────────────────────────────────────────────────────────
  //  "pre-program"  Day is OUTSIDE the active program window  Transparent bg + grey solid border
  //                 (before start_at OR after end_date)       Signals: not part of program at all
  //
  //  "completed"    Day has a real earned record in the DB    🟠 Orange fill + ✓ check + label
  //                 (earnedWeekDates Set, sourced from        Signals: successfully visited
  //                  streak_events table)
  //
  //  "current"      Next unclaimed target day                 Orange tint + dashed border + pulse
  //                 (today if not earned; tomorrow if         Tappable — triggers streak recording
  //                  today is already earned)
  //
  //  "missed"       Past IN-PROGRAM day, not earned           Grey fill + strikethrough label
  //                 (circleDateStr < today, not matched       Signals: a skipped visit
  //                  by any earlier state check)
  //
  //  "upcoming"     Future in-program days beyond current     Grey fill, no border
  //                                                           Signals: days still ahead
  //
  // ─── WHY "pre-program" ≠ "upcoming" (DO NOT merge their styles) ────────────
  //   pre-program = transparent bg + grey SOLID border  → user is excluded from this day
  //   upcoming    = grey fill, NO border               → user is included, just hasn't arrived
  // Merging them would make Mon/Tue look like normal future days when the program
  // started on Wednesday — misleading the user about when their streak window opens.
  //
  // ─── WHY earnedWeekDates beats the streak_days integer ──────────────────────
  // streak_days is a consecutive-day counter; it is WRONG for gap visits:
  //   Wed ✓ → Thu missed → Fri ✓ → streak_days = 1 → Wed shows as "missed" (wrong!)
  // earnedWeekDates is a real per-day Set from the DB and handles gaps correctly.
  //
  // This classification block is the heart of the streak card UI. — PUNTOS team
  // ════════════════════════════════════════════════════════════════════════════
  const days = Array.from({ length: 7 }, (_, index) => {
    const circleDateStr = addDays(weekStartStr, index);

    // ── 1. Before program start → pre-program (white bg, grey solid border) ──
    if (programStartStr && circleDateStr < programStartStr) {
      return { label: streakDaysLabels[index], state: "pre-program" as const };
    }

    // ── 1b. After program end → pre-program (same visual: outside active window) ──
    if (programEndStr && circleDateStr > programEndStr) {
      return { label: streakDaysLabels[index], state: "pre-program" as const };
    }

    // ── 2. Earned days ─────────────────────────────────────────────────────────
    // ⚠️  WARNING — AI / DEVELOPER: DO NOT REPLACE THIS WITH A SIMPLE streak_days CHECK ⚠️
    //
    // earnedWeekDates (real per-day DB records from streak_events) is the ONLY
    // correct source of truth. The streak_days consecutive-window fallback below
    // is INTENTIONALLY kept as a loading skeleton only and is mathematically wrong
    // for non-consecutive visit patterns:
    //
    //   Example: Wed ✓ → Thu missed → Fri ✓
    //     streak_days = 1  (only Fri is consecutive)
    //     diffDays(Fri, Wed) = 2  →  2 ≥ 1  fails  →  Wed incorrectly shows "missed"
    //
    // Three-tier priority (do not reorder):
    //   1. hasEarnedToday  — optimistic UI immediately after tapping (no network wait)
    //   2. earnedWeekDates — real per-day records once fetched from DB (accurate)
    //   3. streak_days window — skeleton-only fallback while earnedWeekDates is loading
    //
    // This ordering was deliberately chosen to prevent circle flicker. — PUNTOS team
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
  const pressOpacity = useSharedValue(1);
  const modalOpacity = useSharedValue(0);
  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: pressOpacity.value,
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
          withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
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
            <View className="flex-row items-center gap-x-2 flex-wrap flex-1">
              <Text className="font-poppins-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                {storeName}
              </Text>
              {nearby && (
                <View className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-md flex-row items-center gap-x-1">
                  <View className="w-1 h-1 rounded-full bg-green-500" />
                  <Text className="text-[9px] font-poppins-semibold text-green-700 dark:text-green-400">
                    {translate("user.rewards.nearby")}
                  </Text>
                </View>
              )}
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
                  <Pressable
                    disabled={isRecording}
                    onPress={async () => {
                      // ── Play animation on ANY tap (quick or held) ──────────────────
                      // withSequence guarantees the full compress→release arc plays even
                      // on a 50ms tap. onPressIn/Out alone miss quick taps entirely.
                      pulseScale.value = withTiming(1, { duration: 60 });
                      pressScale.value = withSequence(
                        withTiming(0.94, { duration: 120, easing: Easing.out(Easing.quad) }),
                        withTiming(1,    { duration: 320, easing: Easing.out(Easing.quad) }),
                      );
                      pressOpacity.value = withSequence(
                        withTiming(0.82, { duration: 120, easing: Easing.out(Easing.quad) }),
                        withTiming(1,    { duration: 320, easing: Easing.out(Easing.quad) }),
                      );

                      // ── Guards ─────────────────────────────────────────────────────
                      if (!nearby) {
                        showModal(
                          "Not Nearby",
                          "You need to be within range of this store to earn your streak.",
                          [{ label: "OK", onPress: closeModal, variant: "primary" }],
                        );
                        return;
                      }
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
                      if (!cachedUserId) return;
                      if (isRecording) return;

                      // ── Optimistic UI: show Lottie instantly, RPC runs in background ──
                      setHasEarnedToday(true);
                      setShowStreakModal(true);
                      setIsRecording(true);
                      try {
                        const result = await recordUserStreak(
                          cachedUserId,
                          Number(streak.store_id),
                          storeStreakId,
                          streakProgram?.fixed_points_per_day ?? 0,
                          targetCount,
                        );
                        if (result.alreadyRecorded) {
                          setHasEarnedToday(false);
                          setShowStreakModal(false);
                          showModal(
                            "Already Earned!",
                            "You've already earned your streak for today. Come back tomorrow!",
                            [{ label: "OK", onPress: closeModal, variant: "primary" }],
                          );
                        } else {
                          if (result.justCompleted) {
                            showModal(
                              "🎉 Streak Complete!",
                              `You've completed the full ${targetCount}-day streak! Your reward is on its way.`,
                              [{ label: "Awesome!", onPress: closeModal, variant: "primary" }],
                            );
                          }
                          onStreakRecorded?.();
                          fetchEarnedDates();
                        }
                      } catch (e) {
                        setHasEarnedToday(false);
                        setShowStreakModal(false);
                        console.error("Failed to record streak:", e);
                        if (e instanceof Error && e.message === STREAK_NEW_ENROLLMENT_BLOCKED) {
                          showModal(
                            translate("user.rewards.messages.streakEnrollmentClosedTitle"),
                            translate("user.rewards.messages.streakEnrollmentClosedBody"),
                            [{ label: "OK", onPress: closeModal, variant: "secondary" }],
                          );
                        } else {
                          showModal(
                            "Error",
                            "Something went wrong. Please try again.",
                            [{ label: "OK", onPress: closeModal, variant: "secondary" }],
                          );
                        }
                      } finally {
                        setIsRecording(false);
                      }
                    }}
                  >
                    {/* Pulse wraps press so both transforms stay on separate layers */}
                    <Animated.View style={shouldPulseCurrentDay ? pulseAnimatedStyle : undefined}>
                      <Animated.View style={pressAnimatedStyle}>
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted"
                          style={{ borderWidth: 1.5, borderColor: "#FF6600", borderStyle: "dashed" }}
                        >
                          <Text className="text-primary font-poppins-semibold text-[10px]">{day.label}</Text>
                        </View>
                      </Animated.View>
                    </Animated.View>
                  </Pressable>
                ) : (
                  // ─── Circle style per state ────────────────────────────────────────────────
                  // ⚠️  WARNING — AI / DEVELOPER: DO NOT UNIFY THESE STYLES ⚠️
                  //
                  // Each state has a DISTINCT visual for a reason:
                  //
                  //   completed   → bg-primary (orange fill)     check icon + label
                  //   pre-program → transparent bg + grey SOLID border
                  //                 ← MUST differ from "upcoming"!
                  //                 Signals: this day is outside the program window entirely
                  //                 (e.g. Mon/Tue when program starts Wed). If you merge this
                  //                 with "upcoming" (grey fill) users cannot tell which days
                  //                 are excluded vs future. This confusion was a confirmed
                  //                 UX bug before these two states were separated.
                  //   missed      → grey fill, no border + strikethrough label
                  //                 Signals: inside program, user skipped this visit
                  //   upcoming    → grey fill, no border (plain label)
                  //                 Signals: inside program, future day — not yet due
                  //
                  // Do NOT merge missed + upcoming + pre-program into one style. — PUNTOS team
                  // ───────────────────────────────────────────────────────────────────────────
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
                      // ⚠️  WARNING — AI / DEVELOPER: DO NOT REPLACE WITH textDecorationLine ⚠️
                      // The strikethrough is rendered as an absolutely-positioned 2px RNView bar.
                      // React Native's textDecorationLine renders too thin to be visible at the
                      // 10px font size used here — it effectively disappears on most devices.
                      // The absolute-position bar was a deliberate fix for that rendering issue.
                      // Keep the RNView strikethrough. Do not "simplify" to CSS. — PUNTOS team
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
