import React, { useState } from "react";
import { View } from "@/tw";

export function DashboardRetentionChartSkeleton() {
    const [chartWidth, setChartWidth] = useState(300);
    const isWide = chartWidth > 450;
    const donutSize = isWide ? 120 : 90;

    return (
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder">
            <View className="h-5 w-32 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            <View className="h-3 w-48 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />

            <View className="w-full" onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
                <View className={`w-full ${isWide ? "flex-row items-center" : "items-center"}`}>
                    {/* Circle for Pie Chart */}
                    <View className={isWide ? "flex-1 items-center justify-center" : "items-center mb-3"}>
                        <View
                            className="bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation"
                            style={{ width: donutSize, height: donutSize }}
                        />
                    </View>

                    {isWide && (
                        <View className="w-px h-20 bg-slate-100 dark:bg-darkBorder mx-4" />
                    )}

                    {/* Legend Skeletons */}
                    <View className={isWide ? "flex-1 pr-2" : "w-full"}>
                        {isWide && (
                            <View className="mb-3">
                                <View className="h-2.5 w-24 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-1.5" />
                                <View className="h-5 w-10 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                            </View>
                        )}
                        <View className="flex-row justify-between items-center mb-2">
                            <View className="flex-row items-center gap-2">
                                <View className="h-2.5 w-2.5 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                                <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                            </View>
                            <View className="h-3 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        </View>
                        <View className="flex-row justify-between items-center mb-2">
                            <View className="flex-row items-center gap-2">
                                <View className="h-2.5 w-2.5 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                                <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                            </View>
                            <View className="h-3 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
