import { View, Text, TouchableOpacity, Image, AnimatedView, Pressable } from "@/tw";
import { ChevronDown, ChevronUp, Flame, MapPin, Sparkles, Store } from "lucide-react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useSingleTap } from "@/hooks/use-single-tap";

interface UserStoreListItemProps {
  store: {
    id: string;
    name: string;
    location: string;
    distanceMeters?: number;
    stampsCount: number;
    targetStamps: number;
    isNearby: boolean;
    logo?: string | null;
    isJoined?: boolean;
    stampEnabled?: boolean;
    streakProgramActive?: boolean;
    streakDays?: number | null;
    streakTarget?: number | null;
  };
  index: number;
  sectionDelay?: number;
  defaultExpanded?: boolean;
}

export default function UserStoreListItem({
  store,
  index,
  sectionDelay = 0,
  defaultExpanded = false,
}: UserStoreListItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handlePressNavigate = useSingleTap(() => router.push(`/store/${store.id}`));

  const clampedStamps = Math.min(Math.max(store.stampsCount, 0), Math.max(store.targetStamps, 1));
  const stampPct = (clampedStamps / Math.max(store.targetStamps, 1)) * 100;

  const hasStreak = !!(store.streakProgramActive ?? (store.streakDays != null && store.streakTarget != null));
  const streakDays = store.streakDays ?? 0;
  const streakTarget = store.streakTarget ?? null;
  const streakPct = hasStreak && streakTarget
    ? (streakDays / Math.max(streakTarget, 1)) * 100
    : 0;

  const hasAnyProgress = !!(store.stampEnabled !== false || hasStreak);

  const scale = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () =>
    (scale.value = withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) }));
  const handlePressOut = () =>
    (scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }));

  return (
    <Animated.View style={animatedScaleStyle}>
      <AnimatedView
        entering={FadeInDown.delay(sectionDelay + index * 60).duration(350)}
        layout={Layout.springify()}
        className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-4 border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none overflow-hidden"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={handlePressNavigate}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="flex-1 flex-row items-center"
          >
            <View className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-white/5 items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
              {store.logo ? (
                <Image source={{ uri: store.logo }} className="w-full h-full" contentFit="cover" />
              ) : (
                <Store size={32} color="#FF6600" />
              )}
            </View>

            <View className="flex-1 ml-4 justify-center">
              <View className="flex-row items-center justify-between mb-0.5">
                <Text
                  className="text-lg font-poppins-bold text-neutral-900 dark:text-white flex-1"
                  numberOfLines={1}
                >
                  {store.name}
                </Text>
                {store.isNearby && (
                  <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-lg ml-2">
                    <Text className="text-[9px] font-poppins-bold text-green-700 dark:text-green-400">
                      NEARBY
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center">
                <MapPin size={14} color="#9CA3AF" />
                <Text
                  className="text-xs text-neutral-400 font-poppins ml-1 flex-1"
                  numberOfLines={1}
                >
                  {store.location}
                </Text>
              </View>
            </View>
          </Pressable>

          {hasAnyProgress && (
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              activeOpacity={0.7}
              className="ml-2 pl-2 py-2"
            >
              {isExpanded ? (
                <ChevronUp size={22} color="#9CA3AF" />
              ) : (
                <ChevronDown size={22} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {hasAnyProgress && isExpanded && (
          <AnimatedView
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
            className="mt-4 pt-3 border-t border-neutral-100 dark:border-darkBorder gap-y-3"
          >
            {hasStreak ? (
              <View>
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-x-1">
                    <Flame size={13} color="#FF6600" />
                    <Text className="text-[10px] font-poppins-medium text-neutral-500 dark:text-neutral-400">
                      Streak Progress
                    </Text>
                  </View>
                  <Text className="text-[10px] font-poppins-bold text-primary">
                    {streakDays}/{streakTarget ?? "?"}
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(streakPct, 100)}%` }}
                  />
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-x-1 opacity-40">
                <Flame size={13} color="#9CA3AF" />
                <Text className="text-[10px] font-poppins-medium text-neutral-400 dark:text-neutral-500">
                  No streak program
                </Text>
              </View>
            )}

            {store.stampEnabled !== false ? (
              <View>
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-x-1">
                    <Sparkles size={13} color="#3b82f6" />
                    <Text className="text-[10px] font-poppins-medium text-neutral-500 dark:text-neutral-400">
                      Stamp Progress
                    </Text>
                  </View>
                  <Text className="text-[10px] font-poppins-bold text-blue-500">
                    {clampedStamps}/{Math.max(store.targetStamps, 1)}
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(stampPct, 100)}%` }}
                  />
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-x-1 opacity-40">
                <Sparkles size={13} color="#9CA3AF" />
                <Text className="text-[10px] font-poppins-medium text-neutral-400 dark:text-neutral-500">
                  No stamp program
                </Text>
              </View>
            )}
          </AnimatedView>
        )}
      </AnimatedView>
    </Animated.View>
  );
}