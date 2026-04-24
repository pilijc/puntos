import React, { useState } from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";
import { RetentionData } from "@/type/store-manager/metric";
import { DashboardRetentionChartSkeleton } from "@/components/skeleton/store_manager/dashboard-retention-chart-skeleton";
import { PieChart } from "react-native-chart-kit";

interface Props {
    data: RetentionData;
    loading?: boolean;
}

export function DashboardRetentionChart({ data, loading }: Props) {
    const { t: translate } = useTranslation();
    const isDark = useColorScheme() === "dark";
    const [chartWidth, setChartWidth] = useState(300);

    const hasData = data.returningCount > 0 || data.newCount > 0;

    const chartData = [
        {
            name: translate("store_manager.dashboard.retention.returning", "Returning"),
            population: hasData ? data.returningCount : 0,
            color: "#ff6600",
            legendFontColor: isDark ? "#e5e5e5" : "#334155",
            legendFontSize: 10
        },
        {
            name: translate("store_manager.dashboard.retention.new", "New"),
            population: hasData ? data.newCount : 1, // dummy value if no data just to render empty pie
            color: isDark ? "#334155" : "#e2e8f0",
            legendFontColor: isDark ? "#e5e5e5" : "#334155",
            legendFontSize: 10
        }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("store_manager.dashboard.retention.title", "User Retention")}
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mt-0.5 mb-4">
                {translate("store_manager.dashboard.retention.subtitle", "Returning vs New Customers")}
            </Text>
            {loading ? (
                <DashboardRetentionChartSkeleton />
            ) : (
                <View 
                    className="w-full items-center justify-center overflow-hidden"
                    onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
                >
                    {chartWidth > 0 && (
                        <View className="items-center w-full">
                            <PieChart
                                data={chartData}
                                width={chartWidth - 40} 
                                height={120}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[(chartWidth - 40) / 4, 0]}
                                hasLegend={false}
                            />
                            
                            <View className="w-full gap-1 mt-2">
                                {chartData.map((item, index) => (
                                    <View key={index} className="flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-2">
                                            <View 
                                                className="w-2.5 h-2.5 rounded-full" 
                                                style={{ backgroundColor: item.color }} 
                                            />
                                            <Text className="text-[10px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                                {item.name}
                                            </Text>
                                        </View>
                                        <Text className="text-[10px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                            {hasData ? (item.population / (data.returningCount + data.newCount) * 100).toFixed(0) : (index === 0 ? "0" : "100")}%
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}