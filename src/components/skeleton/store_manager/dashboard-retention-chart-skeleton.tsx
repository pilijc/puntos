import React from "react";
import { View } from "@/tw";

export function DashboardRetentionChartSkeleton() {
    return (
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder">
            <View className="h-5 w-32 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            <View className="h-3 w-48 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            
            <View className="items-center justify-center w-full h-[120px] my-2">
                {/* Circle for Pie Chart */}
                <View className="h-[120px] w-[120px] bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
            </View>
            
            {/* Legend Skeletons */}
            <View className="w-full mt-2 gap-1">
                <View className="flex-row justify-between items-center">
                    <View className="h-2.5 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                    <View className="h-2.5 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
                <View className="flex-row justify-between items-center">
                    <View className="h-2.5 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                    <View className="h-2.5 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
            </View>
        </View>
    );
}
