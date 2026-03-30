import React, { useEffect, useRef, useState } from "react";
import { View, Text, AnimatedView, TouchableOpacity, Image } from "@/tw";
import { Check, ExternalLink, Flame, Store } from "lucide-react-native";
import Animated, { Layout, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { storeLogos } from "@/data/rewards";
import { useTranslation } from "react-i18next";
import { Alert, ActivityIndicator, Modal, Pressable, StyleSheet, View as RNView } from "react-native";
import { useRouter } from "expo-router";
import { recordUserStreak } from "@/services/streak-service";
import { supabase } from "@/supabase/supabase";

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
  const storeStr = streak.stores as any;
  const storeName = storeStr?.name ?? translate("user.rewards.store");
  const storeAddress = storeStr?.address ?? translate("user.rewards.unknownLocation");
  const nearby =
    nearbyStores.some((s) => Number(s.id) === Number(streak.store_id)) ||
    isStoreNearby(storeStr?.latitude, storeStr?.longitude);

  // Derive if already earned today from last_activity_date
  const today = new Date().toISOString().split("T")[0];
  const alreadyEarnedToday = streak.last_activity_date === today || hasEarnedToday;

  // Real data from backend
  const streakProgram = streak.store_streaks as any;
  const targetCount = streakProgram?.streak_length ?? 7;
  // If earned today (optimistic or from DB), bump displayed count
  const rawCount = streak.streak_days ?? 0;
  const displayCount = rawCount + (hasEarnedToday && streak.last_activity_date !== today ? 1 : 0);
  const clampedCount = Math.min(displayCount, targetCount);

  const streakDays = [
    translate("user.rewards.days.mon"),
    translate("user.rewards.days.tue"),
    translate("user.rewards.days.wed"),
    translate("user.rewards.days.thu"),
    translate("user.rewards.days.fri"),
    translate("user.rewards.days.sat"),
    translate("user.rewards.days.sun"),
  ];

  // Build exactly targetCount circles (or 7 if target is > 7 for safety)
  const displayDayCount = Math.min(targetCount, 7);
  const days = Array.from({ length: displayDayCount }, (_, index) => ({
    label: streakDays[index % 7],
    state:
      index < clampedCount
        ? "completed"
        : index === clampedCount
          ? "current"
          : "upcoming",
  }));

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
    if (nearby) {
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
  }, [nearby]);

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
    return require("../../assets/images/rewards/coffee-shop.png");
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
          {translate("user.rewards.daysThisWeek", { current: clampedCount, target: targetCount })}
        </Text>

        <View className="flex-row flex-wrap justify-between mt-2.5 gap-y-2 px-1">
          {days.map((day, index) => {
            const isCompleted = day.state === "completed";
            const isCurrent = day.state === "current";
            const circleClass = isCompleted
              ? "w-10 h-10 rounded-full bg-primary items-center justify-center"
              : isCurrent
                ? "w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted"
                : "w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center";
            const textClass =
              isCompleted || isCurrent
                ? "text-primary font-poppins-semibold text-[10px]"
                : "text-neutral-400 font-poppins-semibold text-[10px]";
            return (
              <View
                key={`${day.label}-${index}`}
                className="items-center w-11"
              >
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
                      if (alreadyEarnedToday) {
                        Alert.alert("Already Earned!", "You've already earned your streak for today. Come back tomorrow!");
                        return;
                      }
                      if (!nearby) {
                        Alert.alert("Not Nearby", "You need to be within range of this store to earn your streak.");
                        return;
                      }
                      // Need a store_streak_id to record. If no program linked yet, show message.
                      const storeStreakId = streak.store_streak_id;
                      if (!storeStreakId) {
                        Alert.alert("No Program", "This store's streak program isn't fully set up yet.");
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
                        );
                        if (result.alreadyRecorded) {
                          Alert.alert("Already Earned!", "You've already earned your streak for today. Come back tomorrow!");
                        } else {
                          setHasEarnedToday(true);
                          setShowStreakModal(true);
                          onStreakRecorded?.();
                        }
                      } catch (e) {
                        console.error("Failed to record streak:", e);
                        Alert.alert("Error", "Something went wrong. Please try again.");
                      } finally {
                        setIsRecording(false);
                      }
                    }}
                  >
                    <Animated.View style={[pressAnimatedStyle, nearby && pulseAnimatedStyle]}>
                      <View
                        className={circleClass}
                        style={{
                          borderWidth: 1.5,
                          borderColor: "#FF6600",
                          borderStyle: "dashed",
                        }}
                      >
                        <Text className={textClass}>{day.label}</Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                ) : (
                  <View className={circleClass}>
                    {isCompleted ? (
                      <View className="items-center justify-center">
                        <Check size={12} color="#FFFFFF" />
                        <Text className="text-white font-poppins-bold text-[8px] uppercase">
                          {day.label}
                        </Text>
                      </View>
                    ) : (
                      <Text className={textClass}>{day.label}</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Modal
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
              1+
            </Text>
            <Text className="text-center text-white/90 font-poppins-medium text-base mt-2">
              {`Day ${clampedCount} / Day ${targetCount}`}
            </Text>
          </RNView>
        </Animated.View>
      </Modal>
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
