import React from "react";
import { View } from "@/tw";

export function DashboardStampDistributionSkeleton() {
    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <View className="h-4 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            <View className="h-3 w-24 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-5" />
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={`skel-${i}`} className="mb-3">
                    <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-1" />
                    <View className="h-5 w-full bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
            ))}
        </View>
    );
}
