import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { StoreRow } from "@/services/store-service";
import { useStoreDashboardMetrics } from "@/hooks/use-store-metrics";
import { getLast7Labels, getWeekDateRange } from "@/utils/date-helpers";

import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardTransactionList } from "@/components/stores/dashboard-transaction-list";

export interface DashboardStoreViewProps {
    store: StoreRow;
}

export const DashboardStoreView: React.FC<DashboardStoreViewProps> = ({ store }) => {
    const router = useRouter();
    const {
        activeUsers,
        todayTransactions,
        weeklyActivity,
        weeklyStampsActivity,
        recentTransactions,
        loading: metricsLoading,
    } = useStoreDashboardMetrics(
        store.id,
        store.latitude,
        store.longitude,
        store.radius ?? 100
    );

    const dayLabels = useMemo(() => getLast7Labels(), []);
    const weekRange = useMemo(() => getWeekDateRange(), []);

    return (
        <View className="w-full">
            <View className="flex-row gap-[10px] mb-[14px]">
                <DashboardMetricTile
                    label="IN-STORE"
                    value={activeUsers}
                    subtitle="Real-time users"
                    icon="people"
                    loading={metricsLoading}
                    highlight={true}
                />
                <DashboardMetricTile
                    label="SCAN TODAY"
                    value={todayTransactions}
                    subtitle="Redeemed"
                    icon="receipt-long"
                    loading={metricsLoading}
                />
            </View>

            <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
                <View className="flex-row justify-between items-start mb-5">
                    <View>
                        <Text className="text-lg font-poppins-bold text-[#1E293B] leading-6">
                            Weekly Scan Activity
                        </Text>
                        <Text className="text-[12px] font-poppins text-[#94A3B8] mt-0.5">
                            {weekRange}
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="flex-row items-center gap-[2px]"
                        onPress={() => router.push("/(store_manager)/analytics")}
                    >
                        <Text className="text-xs font-poppins-bold text-primary text-right">
                            View{"\n"}Detailed
                        </Text>
                        <MaterialIcons name="chevron-right" size={18} color="#FF6600" />
                    </TouchableOpacity>
                </View>

                <DashboardActivityChart data={weeklyActivity} labels={dayLabels} loading={metricsLoading} />
            </View>

            <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
                <View className="flex-row justify-between items-start mb-5">
                    <View>
                        <Text className="text-lg font-poppins-bold text-[#1E293B] leading-6">
                            Weekly Stamp Activity
                        </Text>
                        <Text className="text-[12px] font-poppins text-[#94A3B8] mt-0.5">
                            {weekRange}
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="flex-row items-center gap-[2px]"
                        onPress={() => router.push("/(store_manager)/analytics")}
                    >
                        <Text className="text-xs font-poppins-bold text-primary text-right">
                            View{"\n"}Detailed
                        </Text>
                        <MaterialIcons name="chevron-right" size={18} color="#FF6600" />
                    </TouchableOpacity>
                </View>

                <DashboardActivityChart data={weeklyStampsActivity} labels={dayLabels} loading={metricsLoading} />
            </View>

            <DashboardTransactionList transactions={recentTransactions} loading={metricsLoading} />
        </View>
    );
};