import React from "react";
import { View } from "@/tw";
import { AnimatedView } from "@/tw"; // Assuming AnimatedView is exported from @/tw or we import from react-native-reanimated
import { FadeIn, FadeOut } from "react-native-reanimated";

export function ProgramSkeleton() {
  return (
    <AnimatedView
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      className="gap-y-3"
    >
      {/* Skeleton — mirrors UserStampLogCard layout exactly */}
      <View className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden mx-1 p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <View className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-white/10" />
            <View className="h-3.5 w-20 rounded-full bg-neutral-200 dark:bg-white/10" />
          </View>
          <View className="flex-row items-center gap-x-3">
            <View className="h-5 w-16 rounded-full bg-neutral-100 dark:bg-white/5" />
            <View className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-white/10" />
            <View className="h-3.5 w-12 rounded-full bg-neutral-200 dark:bg-white/10" />
          </View>
        </View>
        <View className="flex-row items-center gap-x-3 mt-2.5">
          <View className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-white/10" />
          <View className="gap-y-1.5 flex-1">
            <View className="h-3.5 w-1/2 rounded-full bg-neutral-200 dark:bg-white/10" />
            <View className="h-2.5 w-1/3 rounded-full bg-neutral-100 dark:bg-white/5" />
          </View>
        </View>
        <View className="h-2.5 w-28 rounded-full bg-neutral-100 dark:bg-white/5 mt-2" />
        <View className="flex-row justify-between mt-3">
          {[...Array(7)].map((_, i) => (
            <View
              key={i}
              className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-white/10"
            />
          ))}
        </View>
      </View>
    </AnimatedView>
  );
}
