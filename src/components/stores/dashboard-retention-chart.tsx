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

    if (loading) {
        return <DashboardRetentionChartSkeleton />;
    }

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
        <View className="flex-1 bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                {translate("store_manager.dashboard.retention.title", "User Retention")}
            </Text>
            <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary mt-0.5 mb-2">
                {translate("store_manager.dashboard.retention.subtitle", "Returning vs New Customers")}
            </Text>
            
            <View
                className="w-full items-center justify-center"
                onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            >
                {chartWidth > 0 && (
                    <View className={`w-full ${chartWidth > 450 ? 'flex-row items-center justify-between' : 'items-center'}`}>
                        {/* Chart Column */}
                        <View className={chartWidth > 450 ? 'flex-1 items-center' : 'items-center w-full'}>
                            <PieChart
                                data={chartData}
                                width={chartWidth > 450 ? chartWidth / 2 : chartWidth}
                                height={chartWidth > 450 ? 140 : 100}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={chartWidth > 450 ? (chartWidth / 8).toString() : (chartWidth / 4).toString()}
                                center={[0, 0]}
                                hasLegend={false}
                            />
                        </View>

                        {/* Divider for Web */}
                        {chartWidth > 450 && (
                            <View className="w-px h-24 bg-slate-100 dark:bg-darkBorder mx-4" />
                        )}

                        {/* Legend / Stats Column */}
                        <View className={chartWidth > 450 ? 'flex-1 pr-2' : 'w-full gap-1 mt-4'}>
                            {/* Summary Totals for Web */}
                            {chartWidth > 450 && (
                                <View className="mb-4">
                                    <Text className="text-[10px] font-poppins text-textSecondary dark:text-darkTextSecondary uppercase tracking-wider">
                                        {translate("store_manager.dashboard.retention.totalCustomers", "Total Customers")}
                                    </Text>
                                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                        {data.returningCount + data.newCount}
                                    </Text>
                                </View>
                            )}

                            {chartData.map((item, index) => {
                                const total = data.returningCount + data.newCount;
                                const percentage = total > 0 ? (item.population / total * 100).toFixed(0) : (index === 0 ? "0" : "100");
                                
                                return (
                                    <View key={index} className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center gap-2">
                                            <View
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <Text className="text-[12px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                                {item.name}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-[12px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                                {percentage}%
                                            </Text>
                                            {chartWidth > 450 && (
                                                <Text className="text-[10px] font-poppins text-textSecondary/60 dark:text-darkTextSecondary/40">
                                                    {item.population} {translate("store_manager.dashboard.retention.users", "users")}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}