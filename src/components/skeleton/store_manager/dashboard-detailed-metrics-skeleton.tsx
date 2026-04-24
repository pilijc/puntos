import React from "react";
import { View } from "@/tw";

export function DashboardDetailedMetricsSkeleton() {
    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 shadow-sm mt-4 border border-slate-100 dark:border-darkBorder mb-6 animate-pulse will-change-animation">
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-2">
                    <View className="h-6 w-1/3 bg-slate-200 dark:bg-darkBackgroundMuted rounded mb-2" />
                    <View className="h-4 w-3/4 bg-slate-200 dark:bg-darkBackgroundMuted rounded" />
                </View>
                <View className="h-7 w-20 bg-slate-200 dark:bg-darkBackgroundMuted rounded-full" />
            </View>

            <View className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-darkBorder">
                {/* Table Header Skeleton */}
                <View className="flex-row bg-slate-50 dark:bg-darkBackgroundMuted p-3 border-b border-slate-200 dark:border-darkBorder">
                    <View className="flex-1 h-3 bg-slate-200 dark:bg-darkBackground rounded mr-4" />
                    <View className="flex-[2] h-3 bg-slate-200 dark:bg-darkBackground rounded mr-4" />
                    <View className="flex-1 h-3 bg-slate-200 dark:bg-darkBackground rounded" />
                </View>

                {/* Table Body Skeleton (5 rows) */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <View 
                        key={i} 
                        className={`flex-row p-4 items-center ${i !== 5 ? 'border-b border-slate-100 dark:border-darkBorder' : ''}`}
                    >
                        <View className="flex-1">
                            <View className="h-3 w-16 bg-slate-200 dark:bg-darkBackgroundMuted rounded mb-1" />
                            <View className="h-2 w-10 bg-slate-200 dark:bg-darkBackgroundMuted rounded" />
                        </View>
                        <View className="flex-[2] px-2">
                            <View className="h-3 w-24 bg-slate-200 dark:bg-darkBackgroundMuted rounded mb-1" />
                            <View className="h-2 w-16 bg-slate-200 dark:bg-darkBackgroundMuted rounded" />
                        </View>
                        <View className="flex-1 items-end">
                            <View className="h-4 w-8 bg-slate-200 dark:bg-darkBackgroundMuted rounded" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}
