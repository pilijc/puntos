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
            <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
                <View className="h-4 w-40 bg-backgroundMuted rounded-full animate-pulse mb-2" />
                <View className="h-3 w-24 bg-backgroundMuted rounded-full animate-pulse mb-5" />
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="mb-3">
                        <View className="h-3 w-16 bg-backgroundMuted rounded-full animate-pulse mb-1" />
                        <View className="h-5 w-full bg-backgroundMuted rounded-full animate-pulse" />
                    </View>
                ))}
            </View>
        );
    }

    if (buckets.length === 0) {
        return (
            <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
                <Text className="text-lg font-poppins-bold text-[#1E293B] leading-6">
                    Stamp Progress
                </Text>
                <Text className="text-[12px] font-poppins text-[#94A3B8] mt-0.5">
                    No active stamp program found
                </Text>
            </View>
        );
    }

    const totalUsers = buckets.reduce((sum, b) => sum + b.count, 0);

    // colors from light orange → dark orange to show "closer to goal"
    const colors = ["#FED7AA", "#FDBA74", "#FB923C", "#FF6600"];

    return (
        <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
            <Text className="text-lg font-poppins-bold text-[#1E293B] leading-6">
                Stamp Progress
            </Text>
            <Text className="text-[12px] font-poppins text-[#94A3B8] mt-0.5 mb-5">
                Distribution of {totalUsers} users · Goal: {maxStamps} stamps
            </Text>

            {buckets.map((bucket, i) => {
                // fraction of total users are in this bucket?
                const fraction = totalUsers > 0 ? bucket.count / totalUsers : 0;
                const barWidthPercent = Math.max(fraction * 100, bucket.count > 0 ? 4 : 0);
                const color = colors[i] ?? "#FF6600";

                return (
                    <View key={i} className="mb-3">
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-[11px] font-poppins-bold text-[#334155]">
                                {bucket.label} stamps
                            </Text>
                            <Text className="text-[11px] font-poppins text-[#94A3B8]">
                                {bucket.count} user{bucket.count !== 1 ? "s" : ""}
                            </Text>
                        </View>

                        <View className="w-full h-[10px] bg-[#F1F5F9] rounded-full overflow-hidden">
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