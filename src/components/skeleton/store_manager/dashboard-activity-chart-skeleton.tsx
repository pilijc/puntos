import React, { useState } from "react";
import { Platform } from "react-native";
import { View } from "@/tw";

const isWeb = Platform.OS === "web";

export function DashboardActivityChartSkeleton() {
    const [containerWidth, setContainerWidth] = useState(0);
    const visibleDays = isWeb 
        ? containerWidth > 700 ? 14 : containerWidth > 450 ? 10 : containerWidth > 350 ? 7 : 5
        : 7;

    return (
        <View
            className={`bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder${isWeb ? ' h-[504px]' : ' mb-[14px]'}`}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32)}
        >
            {/* Title block */}
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <View className="h-5 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
                    <View className="h-3 w-32 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                </View>
            </View>

            {/* Chart area */}
            <View
                className="w-full bg-backgroundMuted dark:bg-darkBackground rounded-xl animate-pulse will-change-animation mb-5"
                style={{ height: isWeb ? 285 : 85 }}
            />

            {/* Day labels */}
            <View className="flex-row justify-between px-5">
                {Array.from({ length: visibleDays }).map((_, i) => (
                    <View
                        key={`label-skel-${i}`}
                        className="h-2 w-6 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation"
                    />
                ))}
            </View>

            {/* Web-only: summary stats row */}
            {isWeb && (
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
