import React, { useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { View } from "@/tw";

const isWeb = Platform.OS === "web";

export function DashboardActivityChartSkeleton() {
    const [containerWidth, setContainerWidth] = useState(0);
    const { width: windowWidth } = useWindowDimensions();
    const measuredWidth = containerWidth || windowWidth;
    const isCompactWeb = isWeb && measuredWidth < 560;

    return (
        <View
            className={`bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder${isWeb && !isCompactWeb ? ' h-[504px]' : !isWeb ? ' mb-[14px]' : ''}`}
            onLayout={(e) => setContainerWidth(Math.max(e.nativeEvent.layout.width - 32, 0))}
        >
            {/* Title block */}
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <View className="h-5 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
                    <View className="h-3 w-32 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
                {isWeb && !isCompactWeb && (
                    <View className="h-10 w-36 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                )}
            </View>

            {/* Chart area */}
            <View
                className="w-full bg-backgroundMuted dark:bg-darkBackground rounded-xl animate-pulse will-change-animation"
                style={{ height: isWeb ? (isCompactWeb ? 190 : 285) : 100 }}
            />

            {/* Web-only: summary stats row */}
            {isWeb && !isCompactWeb && (
                <View className="flex-row justify-around mt-5 pt-5 border-t border-slate-100 dark:border-darkBorder">
                    <View className="items-center">
                        <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        <View className="h-6 w-10 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mt-1" />
                    </View>
                    <View className="w-px h-8 bg-slate-100 dark:bg-darkBorder" />
                    <View className="items-center">
                        <View className="h-3 w-14 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        <View className="h-6 w-[68px] bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mt-1" />
                    </View>
                    <View className="w-px h-8 bg-slate-100 dark:bg-darkBorder" />
                    <View className="items-center">
                        <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        <View className="h-6 w-12 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mt-1" />
                    </View>
                </View>
            )}
        </View>
    );
}
