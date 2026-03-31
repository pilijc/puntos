import React from "react";
import { View } from "@/tw";

export function DashboardRetentionChartSkeleton() {
    return (
        <>
            <View key="loading-reten" className="items-center justify-center py-3">
                <View className="w-[130px] h-[130px] rounded-full bg-backgroundMuted dark:bg-darkBackground animate-pulse will-change-animation" />
            </View>
            <View className="w-full gap-[4px] mt-4">
                <View className="flex-row justify-between items-center h-[20px]">
                    <View className="h-5 w-20 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                    <View className="h-5 w-8 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
                <View className="flex-row justify-between items-center h-[25px]">
                    <View className="h-5 w-20 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                    <View className="h-5 w-8 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
            </View>
        </>
    );
}
