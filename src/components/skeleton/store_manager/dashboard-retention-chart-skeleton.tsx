import React from "react";
import { View } from "@/tw";

export function DashboardRetentionChartSkeleton() {
    return (
        <View className="w-full mt-4 items-center">
            {/* Circle for Pie Chart */}
            <View className="h-[110px] w-[110px] bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
            
            {/* Legend Skeletons */}
            <View className="w-full mt-2 gap-2">
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
