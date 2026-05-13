import React, { useState } from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";
import { RetentionData } from "@/type/store-manager/metric";
import { DashboardRetentionChartSkeleton } from "@/components/skeleton/store_manager/dashboard-retention-chart-skeleton";
import Svg, { Circle, G } from "react-native-svg";

interface Props {
    data: RetentionData;
    loading?: boolean;
}

interface DonutChartProps {
    returningCount: number;
    newCount: number;
    isDark: boolean;
    size?: number;
    strokeWidth?: number;
}

function DonutChart({ returningCount, newCount, isDark, size = 100, strokeWidth = 14 }: DonutChartProps) {
    const total = returningCount + newCount;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Background track color
    const trackColor = isDark ? "#1e293b" : "#e2e8f0";
    const returningColor = "#ff6600";
    const newColor = isDark ? "#334155" : "#cbd5e1";

    if (total === 0) {
        // No data: render a single grey track ring
        return (
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
            </Svg>
        );
    }

    const returningFraction = returningCount / total;
    const returningDash = returningFraction * circumference;
    const newDash = (newCount / total) * circumference;
    const gap = 2; // 2px gap between segments

    return (
        <Svg width={size} height={size}>
            {/* Track */}
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="transparent"
            />
            <G rotation="-90" origin={`${center}, ${center}`}>
                {/* Returning segment */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={returningColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${Math.max(0, returningDash - gap)} ${circumference - (returningDash - gap)}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                />
                {/* New segment */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={newColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${Math.max(0, newDash - gap)} ${circumference - (newDash - gap)}`}
                    strokeDashoffset={-(returningDash)}
                    strokeLinecap="round"
                />
            </G>
        </Svg>
    );
}

export function DashboardRetentionChart({ data, loading }: Props) {
    const { t: translate } = useTranslation();
    const isDark = useColorScheme() === "dark";
    const [chartWidth, setChartWidth] = useState(300);

    if (loading) {
        return <DashboardRetentionChartSkeleton />;
    }

    const total = data.returningCount + data.newCount;
    const returningPercent = total > 0 ? Math.round((data.returningCount / total) * 100) : 0;
    const newPercent = total > 0 ? 100 - returningPercent : 0;

    const isWide = chartWidth > 450;
    const donutSize = isWide ? 120 : 90;

    const legendItems = [
        {
            label: translate("storeManager.dashboard.retention.returning", "Returning"),
            count: data.returningCount,
            percent: returningPercent,
            color: "#ff6600",
        },
        {
            label: translate("storeManager.dashboard.retention.new", "New"),
            count: data.newCount,
            percent: newPercent,
            color: isDark ? "#334155" : "#cbd5e1",
        },
    ];

    return (
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 border border-slate-100 dark:border-darkBorder">
            <Text className="text-[17px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("storeManager.dashboard.retention.title", "User Retention")}
            </Text>
            <Text className="text-[12px] font-poppins text-textSecondary dark:text-darkTextSecondary mt-0.5 mb-3">
                {translate("storeManager.dashboard.retention.subtitle", "Returning vs New Customers")}
            </Text>

            <View
                className="w-full"
                onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            >
                {chartWidth > 0 && (
                    <View className={`w-full ${isWide ? 'flex-row items-center' : 'items-center'}`}>
                        {/* Donut Chart */}
                        <View className={isWide ? 'flex-1 items-center justify-center' : 'items-center mb-3'}>
                            <DonutChart
                                returningCount={data.returningCount}
                                newCount={data.newCount}
                                isDark={isDark}
                                size={donutSize}
                                strokeWidth={isWide ? 16 : 12}
                            />
                        </View>

                        {/* Divider for wide layout */}
                        {isWide && (
                            <View className="w-px h-20 bg-slate-100 dark:bg-darkBorder mx-4" />
                        )}

                        {/* Legend */}
                        <View className={isWide ? 'flex-1 pr-2' : 'w-full'}>
                            {isWide && (
                                <View className="mb-3">
                                    <Text className="text-[10px] font-poppins-semibold text-textSecondary dark:text-darkTextSecondary uppercase tracking-wider">
                                        {translate("storeManager.dashboard.retention.totalCustomers", "Total Customers")}
                                    </Text>
                                    <Text className="text-[24px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-8">
                                        {total}
                                    </Text>
                                </View>
                            )}

                            {legendItems.map((item, index) => (
                                <View key={index} className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center gap-2">
                                        <View
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <Text className="text-[12px] font-poppins-medium text-textSecondary dark:text-darkTextSecondary">
                                            {item.label}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                            {item.percent}%
                                        </Text>
                                        {isWide && (
                                            <Text className="text-[10px] font-poppins text-textSecondary/60 dark:text-darkTextSecondary/40">
                                                {item.count} {translate("storeManager.dashboard.retention.users", "users")}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
