import React from "react";
import { Platform } from "react-native";
import { View } from "@/tw";

const isWeb = Platform.OS === "web";

export function DashboardStampDistributionSkeleton() {
    return (
        <View 
            className={`bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder${isWeb ? '' : ' mb-[14px]'}`}
            style={isWeb ? { flex: 1 } : undefined}
        >
            <View className="h-4 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            <View className="h-3 w-24 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
            <View className="flex-col gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={`skel-${i}`} className="flex-row items-center">
                        <View className="h-2.5 w-10 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mr-3" />
                        <View className="flex-1 h-2.5 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                        <View className="h-2.5 w-8 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation ml-3" />
                    </View>
                ))}
            </View>
        </View>
    );
}
