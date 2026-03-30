import React from "react";
import { View } from "@/tw";

export function DashboardActivityChartSkeleton() {
    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <View className="flex-row justify-between items-start mb-5">
                <View>
                    <View className="h-5 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
                    <View className="h-3 w-32 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
            </View>
            <View className="h-[85px] w-full bg-backgroundMuted dark:bg-darkBackground rounded-xl animate-pulse will-change-animation mb-7" />
            <View className="flex-row justify-between px-5">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View key={`label-skel-${i}`} className="h-2 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                ))}
            </View>
        </View>
    );
}
