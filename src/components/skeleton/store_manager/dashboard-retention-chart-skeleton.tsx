import React from "react";
import { View } from "@/tw";

export function DashboardRetentionChartSkeleton() {
    return (
        <View key="loading-reten" className="items-center justify-center py-4">
            <View className="w-[120px] h-[120px] rounded-full bg-backgroundMuted dark:bg-darkBackground animate-pulse will-change-animation" />
        </View>
    );
}
