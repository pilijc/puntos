import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { Ticket } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StampDistributionProps } from "@/type/store-manager/metric";
import { DashboardStampDistributionSkeleton } from "@/components/skeleton/store_manager/dashboard-stamp-distribution-skeleton";

export function DashboardStampDistribution({ buckets, maxStamps, loading }: StampDistributionProps) {
    const { t: translate } = useTranslation();

    const isDark = useColorScheme() === "dark";

    if (loading) return <DashboardStampDistributionSkeleton />;

    if (buckets.length === 0) {
        return (
            <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-6 elevation-1 border border-slate-100 dark:border-darkBorder items-center justify-center">
                <View className="bg-slate-50 dark:bg-darkBackgroundMuted p-4 rounded-full mb-4">
                    <Ticket size={32} color={isDark ? "#525252" : "#cbd5e1"} />
                </View>
                <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
                    {translate("storeManager.dashboard.stampProgress.noProgram", "No active stamp program")}
                </Text>
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary mt-1.5 text-center px-4 leading-5">
                    {translate("storeManager.dashboard.stampProgress.noProgramDesc", "Create a stamp program to reward loyal customers and track their progress here.")}
                </Text>
            </View>
        );
    }

    const totalUsers = buckets.reduce((sum, b) => sum + b.count, 0);
    const maxCount = Math.max(...buckets.map(b => b.count));

    return (
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 border border-slate-100 dark:border-darkBorder">
            <Text className="text-[17px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("storeManager.dashboard.stampProgress.title", "Stamp Progress")}
            </Text>
            <Text className="text-[12px] font-poppins text-textSecondary dark:text-darkTextSecondary mt-0.5 mb-4">
                {translate("storeManager.dashboard.stampProgress.distribution", "Distribution of {{users}} users", {
                    users: totalUsers,
                    goal: maxStamps,
                })}
            </Text>

            <View className="flex-col gap-3.5">
                {buckets.map((bucket, index) => {
                    const widthPercent = maxCount === 0 ? 0 : (bucket.count / maxCount) * 100;
                    return (
                        <View key={index} className="flex-row items-center">
                            <Text className="text-[12px] font-poppins-medium text-textSecondary dark:text-darkTextSecondary w-10 text-right mr-3">
                                {bucket.label}
                            </Text>
                            <View className="flex-1 h-3 bg-slate-100 dark:bg-darkBackgroundMuted rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-[#ff6600] rounded-full" 
                                    style={{ width: `${widthPercent}%` }} 
                                />
                            </View>
                            <Text className="text-[12px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary w-8 text-right ml-3">
                                {bucket.count}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
