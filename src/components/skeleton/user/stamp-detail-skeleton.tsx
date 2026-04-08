import React from "react";
import { View, AnimatedView } from "@/tw";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { ScrollView } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * StampDetailSkeleton provides a pixel-perfect, zero-jump loading state for the Stamp Log Detail view.
 * 
 * HOW WE ACHIEVED 1:1 PERFECT ALIGNMENT:
 * 1. Root Container Mirroring: We use an `AnimatedScrollView` holding the exact
 *    `contentContainerStyle={{ padding: 16, paddingBottom: 40 }}` as the primary layout.
 * 2. Component Silhouettes: We meticulously re-created the StampCard ticket geometry 
 *    (including the perforated 16px high separator) so the flex growth is identical.
 * 3. Typographical Bounding: Text placeholders use exact heights (e.g. h-[17px], h-[12px])
 *    that correspond to the Poppins font's expected line-heights on the main screen.
 * 4. Structural Guardrails: Containers use hardcoded heights for history sections (h-[130px])
 *    to preserve the scroll position relative to the punch card above them.
 */
export function StampDetailSkeleton() {
  return (
    <AnimatedScrollView
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      className="flex-1 bg-background dark:bg-darkBackground"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* The Single Active Punch Card Skeleton */}
      <View className="mb-2">
        <View className="border bg-white dark:bg-darkBackgroundCard rounded-3xl overflow-hidden shadow-sm shadow-neutral-100 dark:shadow-none border-neutral-100 dark:border-darkBorder">
          
          {/* Header Top */}
          <View className="px-4 py-4 flex-row items-center gap-x-3">
            <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-100 dark:border-darkBorder" />
            <View className="flex-1 gap-y-1.5">
              <View className="h-[17px] w-2/3 bg-neutral-200 dark:bg-white/10 rounded-md" />
              <View className="h-[12px] w-1/3 bg-neutral-100 dark:bg-white/5 rounded-md" />
            </View>
            <View className="items-end justify-center pr-1">
              <View className="h-[21px] w-12 bg-neutral-200 dark:bg-white/10 rounded-md" />
            </View>
          </View>

          {/* Perforated separator (Ticket Effect) */}
          <View className="relative h-4 flex-row items-center overflow-hidden">
            <View className="absolute -left-2 w-4 h-4 bg-neutral-50 dark:bg-darkBackground rounded-full border border-neutral-200 dark:border-darkBorder" />
            <View className="flex-1 border-t border-dashed border-neutral-200 dark:border-darkBorder mx-4" />
            <View className="absolute -right-2 w-4 h-4 bg-neutral-50 dark:bg-darkBackground rounded-full border border-neutral-200 dark:border-darkBorder" />
          </View>

          {/* Punch Grid */}
          <View className="px-4 py-8 gap-y-7">
            <View className="items-center w-full px-1">
              <View className="flex-row justify-start gap-x-2">
                {[...Array(5)].map((_, i) => (
                  <View key={i} className="items-center">
                    <View className="w-[62px] h-[62px] rounded-2xl bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder items-center justify-center pointer-events-none" />
                  </View>
                ))}
              </View>
              <View className="flex-row justify-start gap-x-2 mt-3">
                {[...Array(5)].map((_, i) => (
                  <View key={i} className="items-center">
                    <View className="w-[62px] h-[62px] rounded-2xl bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder items-center justify-center pointer-events-none" />
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Footer (Rewards & Deadlines) */}
          <View className="bg-neutral-50 dark:bg-darkBackgroundMuted border-t border-neutral-100 dark:border-darkBorder px-4 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2.5 flex-1 mr-2">
              <View className="w-8 h-8 rounded-lg items-center justify-center bg-white border border-neutral-200 dark:border-darkBorder dark:bg-darkBackgroundCard">
                <View className="w-4 h-4 rounded-sm bg-neutral-200 dark:bg-white/10" />
              </View>
              <View className="h-[12px] w-2/3 bg-neutral-200 dark:bg-white/10 rounded-md" />
            </View>
            <View className="bg-neutral-100 dark:bg-darkBackgroundCard pt-[6px] pb-[6px] px-3 rounded-full flex-row items-center gap-x-1 border border-neutral-200 dark:border-darkBorder">
               <View className="h-[10px] w-10 bg-neutral-200 dark:bg-white/10 rounded-sm" />
            </View>
          </View>
        </View>

        <View className="items-center mt-3 mb-6">
          <View className="h-[12px] w-3/4 bg-neutral-200 dark:bg-white/10 rounded-md" />
        </View>
      </View>

      {/* Stamp History Skeleton */}
      <View className="mb-8">
        <View className="flex-row items-center gap-x-2 mb-4 px-1">
          <View className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
          <View className="h-[17px] w-28 bg-neutral-200 dark:bg-white/10 rounded-md" />
        </View>
        <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-neutral-100 dark:border-darkBorder h-[130px] items-center justify-center">
           <View className="h-[12px] w-1/2 bg-neutral-100 dark:bg-white/5 rounded-md" />
        </View>
      </View>

      {/* Reward History Skeleton */}
      <View className="mb-4">
        <View className="flex-row items-center gap-x-2 mb-4 px-1">
          <View className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
          <View className="h-[17px] w-32 bg-neutral-200 dark:bg-white/10 rounded-md" />
        </View>
        <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-neutral-100 dark:border-darkBorder h-[120px] items-center justify-center">
           <View className="h-[12px] w-1/2 bg-neutral-100 dark:bg-white/5 rounded-md" />
        </View>
      </View>

    </AnimatedScrollView>
  );
}
