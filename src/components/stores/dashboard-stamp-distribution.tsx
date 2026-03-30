import React from "react";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";
import { StampDistributionProps } from "@/type/store-manager/metric";
import { DashboardStampDistributionSkeleton } from "@/components/skeleton/store_manager/dashboard-stamp-distribution-skeleton";

export function DashboardStampDistribution({
    buckets,
    maxStamps,
    loading,
}: StampDistributionProps) {
    const { t: translate } = useTranslation();

    if (loading) {
        return <DashboardStampDistributionSkeleton />;
    }

    if (buckets.length === 0) {
        return (
            <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                    {translate("storeManager.dashboard.stampProgress.title")}
                </Text>
                <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5">
                    {translate("storeManager.dashboard.stampProgress.noProgram")}
                </Text>
            </View>
        );
    }

    const totalUsers = buckets.reduce((sum, b) => sum + b.count, 0);
    const colors = ["#FFEDD5", "#FED7AA", "#FDBA74", "#FB923C", "#FF6600"];

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("storeManager.dashboard.stampProgress.title")}
            </Text>
            <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5 mb-5">
                {translate("storeManager.dashboard.stampProgress.distribution", { users: totalUsers, goal: maxStamps })}
            </Text>

            {buckets.map((bucket, i) => {
                const fraction = totalUsers > 0 ? bucket.count / totalUsers : 0;
                const barWidthPercent = Math.max(fraction * 100, bucket.count > 0 ? 4 : 0);
                const color = colors[i] ?? "#FF6600";

                return (
                    <View key={`bucket-${i}`} className="mb-3">
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-[11px] font-poppins-bold text-textSecondary dark:text-darkTextPrimary">
                                {bucket.label} {translate("storeManager.dashboard.stampProgress.stamps")}
                            </Text>
                            <Text className="text-[11px] font-poppins text-textMuted dark:text-darkTextSecondary">
                                {bucket.count} {bucket.count !== 1 ? translate("storeManager.dashboard.stampProgress.users") : translate("storeManager.dashboard.stampProgress.user")}
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