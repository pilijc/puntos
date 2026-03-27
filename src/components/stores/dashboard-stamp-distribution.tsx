import React from "react";
import { View, Text } from "@/tw";
import { StampDistributionProps } from "@/type/store-manager/metric";

export function DashboardStampDistribution({
    buckets,
    maxStamps,
    loading,
}: StampDistributionProps) {
    if (loading) {
        return (
            <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
                <View className="h-4 w-40 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-2" />
                <View className="h-3 w-24 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-5" />
                {[1, 2, 3, 4].map((i) => (
                    <View key={`skel-${i}`} className="mb-3">
                        <View className="h-3 w-16 bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation mb-1" />
                        <View className="h-5 w-full bg-backgroundMuted dark:bg-darkBackground rounded-full animate-pulse will-change-animation" />
                    </View>
                ))}
            </View>
        );
    }

    if (buckets.length === 0) {
        return (
            <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                    Stamp Progress
                </Text>
                <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5">
                    No active stamp program found
                </Text>
            </View>
        );
    }

    const totalUsers = buckets.reduce((sum, b) => sum + b.count, 0);
    const colors = ["#FED7AA", "#FDBA74", "#FB923C", "#FF6600"];

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                Stamp Progress
            </Text>
            <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5 mb-5">
                Distribution of {totalUsers} users · Goal: {maxStamps} stamps
            </Text>

            {buckets.map((bucket, i) => {
                const fraction = totalUsers > 0 ? bucket.count / totalUsers : 0;
                const barWidthPercent = Math.max(fraction * 100, bucket.count > 0 ? 4 : 0);
                const color = colors[i] ?? "#FF6600";

                return (
                    <View key={`bucket-${i}`} className="mb-3">
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-[11px] font-poppins-bold text-textSecondary dark:text-darkTextPrimary">
                                {bucket.label} stamps
                            </Text>
                            <Text className="text-[11px] font-poppins text-textMuted dark:text-darkTextSecondary">
                                {bucket.count} user{bucket.count !== 1 ? "s" : ""}
                            </Text>
                        </View>

                        <View className="w-full h-[10px] bg-slate-100 dark:bg-darkBackgroundMuted rounded-full overflow-hidden">
                            <View
                                style={{
                                    width: `${barWidthPercent}%`,
                                    height: "100%",
                                    backgroundColor: color,
                                    borderRadius: 9999,
                                }}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}