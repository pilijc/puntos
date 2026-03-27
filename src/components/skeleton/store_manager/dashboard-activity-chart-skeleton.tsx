import React from "react";
import { View } from "@/tw";

export function DashboardActivityChartSkeleton() {
    return (
        <View key="skeleton-activity" style={{ height: 110 }} className="w-full bg-backgroundMuted dark:bg-darkBackground rounded-[12px] animate-pulse will-change-animation" />
    );
}
