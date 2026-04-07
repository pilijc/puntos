import React from "react";
import { View } from "@/tw";
import { AnimatedView } from "@/tw";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { ScrollView } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * StreakDetailSkeleton ensures a pixel-perfect, zero-jump loading state.
 * 
 * HOW WE ACHIEVED 1:1 PERFECT ALIGNMENT:
 * 1. Root Container Match: We use `AnimatedScrollView` and identical `contentContainerStyle`
 *    padding to match the real `streaks.tsx` ScrollView.
 * 2. Exact Bounding Boxes: We use hardcoded widths corresponding precisely to flex boundaries
 *    (e.g., `w-[32px] h-[32px]` for the back button wrapper, matching padding 4 + icon 24).
 * 3. Typographical Math: Ghost texts mimic font line-heights exactly. For example, `text-[9px]`
 *    with `mt-0.5` translates strictly to `h-[9px] mt-0.5` blocks, preventing flex expansion shifting.
 */
export function StreakDetailSkeleton() {
  return (
    <AnimatedScrollView
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      className="flex-1 bg-background dark:bg-darkBackground"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Skeleton */}
      <View className="bg-white dark:bg-darkBackgroundMuted flex-row items-center px-4 pt-12 pb-3 border-b border-neutral-100 dark:border-darkBorder">
        <View className="w-[32px] h-[32px] items-center justify-center mr-[8px]">
          <View className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-white/5" />
        </View>
        <View className="h-5 w-28 rounded-md bg-neutral-200 dark:bg-white/10" />
      </View>

      {/* Store Box Skeleton */}
      <View className="bg-white dark:bg-darkBackgroundMuted mx-4 mt-4 rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
        <View className="flex-row">
          <View className="w-1.5 bg-neutral-200 dark:bg-neutral-700" />
          <View className="flex-row items-center gap-x-3 p-3.5 flex-1">
            <View className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-darkBorder" />
            <View className="flex-1 justify-center">
              <View className="h-5 w-2/3 rounded-md bg-neutral-200 dark:bg-white/10" />
              <View className="h-3.5 w-1/2 rounded-md bg-neutral-100 dark:bg-white/5 mt-0.5" />
            </View>
          </View>
        </View>
        <View className="bg-neutral-50 dark:bg-darkBackground/50 px-4 py-2.5 flex-row items-center justify-between border-t border-neutral-100 dark:border-darkBorder">
          <View className="h-3 w-32 rounded-md bg-neutral-200 dark:bg-white/10" />
          <View className="h-3 w-16 rounded-md bg-neutral-200 dark:bg-white/10" />
        </View>
      </View>

      {/* Progress Ring Skeleton */}
      <View className="bg-white dark:bg-darkBackgroundMuted mx-4 mt-3 rounded-2xl border border-neutral-100 dark:border-darkBorder items-center py-6">
        <View className="w-[150px] h-[150px] rounded-full border-[14px] border-neutral-100 dark:border-darkBorder items-center justify-center">
          <View className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-white/10 mb-[2px]" />
          <View className="h-10 w-14 rounded-md bg-neutral-200 dark:bg-white/10" />
          <View className="h-[11px] w-16 rounded-md bg-neutral-100 dark:bg-white/5 mt-1" />
        </View>
        <View className="h-[24px] w-[140px] rounded-full bg-neutral-50 dark:bg-darkBackground/50 mt-4 border border-neutral-100 dark:border-darkBorder" />
        <View className="flex-row items-center gap-x-3 mt-3">
          <View className="h-[11px] w-[80px] rounded-md bg-neutral-100 dark:bg-white/5" />
          <View className="h-1 w-1 rounded-full bg-neutral-200 dark:bg-white/10" />
          <View className="h-[11px] w-[80px] rounded-md bg-neutral-100 dark:bg-white/5" />
        </View>
      </View>

      {/* Stat Cards & Bottom Section Skeleton */}
      <View className="px-4 pt-3 pb-4 gap-y-3">
        <View className="flex-row gap-x-2.5">
          {[...Array(3)].map((_, i) => (
            <View
              key={i}
              className="flex-1 bg-white dark:bg-darkBackgroundMuted rounded-2xl p-3 items-center border border-neutral-100 dark:border-darkBorder"
            >
              <View className="flex-row items-center gap-x-1.5">
                <View className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
                <View className="h-6 w-8 rounded-md bg-neutral-200 dark:bg-white/10" />
              </View>
              <View className="h-[9px] w-16 rounded-md bg-neutral-100 dark:bg-white/5 mt-0.5" />
            </View>
          ))}
        </View>

        {/* Action Call Skeleton */}
        <View className="bg-white dark:bg-darkBackgroundMuted rounded-3xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
          <View className="flex-row items-center gap-x-2.5 p-4">
            <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center border border-neutral-200 dark:border-darkBorder" />
            <View className="flex-1">
              <View className="h-[17px] w-full rounded-md bg-neutral-200 dark:bg-white/10" />
              <View className="h-[14px] w-5/6 rounded-md bg-neutral-100 dark:bg-white/5 mt-0.5" />
            </View>
          </View>
          <View className="h-px w-full bg-neutral-100 dark:bg-darkBorder" />
          <View className="flex-row items-center justify-end gap-x-3 px-4 py-3 bg-neutral-50 dark:bg-darkBackground">
             <View className="h-8 w-24 rounded-full bg-neutral-200 dark:bg-white/10" />
          </View>
        </View>

        {/* Calendar Section Skeleton */}
        <View className="bg-white dark:bg-darkBackgroundMuted rounded-3xl p-4 border border-neutral-100 dark:border-darkBorder mt-1">
          <View className="flex-row items-center gap-x-2 mb-3">
            <View className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
            <View className="h-4 w-28 rounded-md bg-neutral-200 dark:bg-white/10" />
          </View>
          <View className="h-[80px] w-full bg-neutral-50 dark:bg-darkBackground/50 rounded-xl border border-neutral-100 dark:border-darkBorder" />
        </View>
      </View>
    </AnimatedScrollView>
  );
}
