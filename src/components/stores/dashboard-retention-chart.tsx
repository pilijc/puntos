import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import Svg, { Circle } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { RetentionData } from "@/type/store-manager/metric";
import { DashboardRetentionChartSkeleton } from "@/components/skeleton/store_manager/dashboard-retention-chart-skeleton";

interface Props {
    data: RetentionData;
    loading?: boolean;
}

export function DashboardRetentionChart({ data, loading }: Props) {
    const { t: translate } = useTranslation();
    const isDark = useColorScheme() === "dark";
    const { returningPercent, newPercent } = data;

    const size = 130;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const dashOffset = circumference - (returningPercent / 100) * circumference;

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[8px] border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("store_manager.dashboard.retention.title")}
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mt-0.5">
                {translate("store_manager.dashboard.retention.subtitle")}
            </Text>

            {loading ? (
                <DashboardRetentionChartSkeleton />
            ) : (
                <React.Fragment key="content-reten">
                    <View className="items-center justify-center my-3">
                        <View style={{ width: size, height: size, position: "relative" }}>
                            <Svg width={size} height={size}>
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke={isDark ? "#262626" : "#e5e7eb"}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="#ff6600"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                />
                            </Svg>

                            <View className="absolute inset-0 items-center justify-center">
                                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                    {returningPercent}%
                                </Text>
                                <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted tracking-wide uppercase">
                                    {translate("store_manager.dashboard.retention.returning")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="gap-[4px] mt-4">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-primary" />
                                <Text className="text-[13px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                    {translate("store_manager.dashboard.retention.returning")}
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary dark:text-darkTextSecondary">
                                {returningPercent}%
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-slate-100 dark:bg-darkBackgroundMuted" />
                                <Text className="text-[13px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                    {translate("store_manager.dashboard.retention.new")}
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary dark:text-darkTextSecondary">
                                {newPercent}%
                            </Text>
                        </View>
                    </View>
                </React.Fragment>
            )}
        </View>
    );
}