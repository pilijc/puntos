import React, { useState, useCallback, useMemo } from "react";
import { RefreshControl } from "react-native";
import { ScrollView, View, Text, SafeAreaView } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";

import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useStoreDashboardMetrics } from "@/hooks/use-store-metrics";
import { getLast7Labels, getWeekDateRange } from "@/utils/date-helpers";

import { StorePickerDropdown } from "@/components/stores/store-picker-dropdown";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardRetentionChart } from "@/components/stores/dashboard-retention-chart";
import { DashboardStampDistribution } from "@/components/stores/dashboard-stamp-distribution";

export default function StoreManagerDashboard() {
    const {
        stores,
        isFetching: refreshing,
        fetchStores: refresh
    } = useManagerStoresStore();

    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(useCallback(() => { refresh(true); }, []));

    React.useEffect(() => {
        if (!selectedStoreId && stores.length > 0) {
            setSelectedStoreId(stores[0].id);
        }
    }, [stores, selectedStoreId]);

    const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

    const {
        activeUsers,
        todayTransactions,
        weeklyActivity,
        retention,
        stampBuckets,
        stampMaxStamps,
        loading: metricsLoading
    } = useStoreDashboardMetrics(
        selectedStore?.id ?? 0,
        selectedStore?.latitude ?? null,
        selectedStore?.longitude ?? null,
        selectedStore?.radius ?? 100
    );

    //memo so labels dont recalculate on every render
    const dayLabels = useMemo(() => getLast7Labels(), []);
    const weekRange = useMemo(() => getWeekDateRange(), []);

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor="#ff6600"
                        colors={["#ff6600"]}
                    />
                }
            >
                <View className="mb-[24px]">
                    <View className="flex-row justify-between items-center mb-[4px]">
                        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            Dashboard
                        </Text>
                        <StorePickerDropdown
                            stores={stores}
                            selectedStore={selectedStore}
                            isVisible={isDropdownVisible}
                            onOpen={() => setDropdownVisible(true)}
                            onClose={() => setDropdownVisible(false)}
                            onSelect={(id) => setSelectedStoreId(id)}
                        />
                    </View>

                    {selectedStore?.address && (
                        <View className="flex-row items-center">
                            <MaterialIcons name="location-on" size={14} color="#94a3b8" />
                            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted ml-[4px]">
                                {selectedStore.address}
                            </Text>
                        </View>
                    )}
                </View>

                {selectedStore ? (
                    <View className="w-full mb-8">
                        <View className="flex-row gap-[10px] mb-[14px]">
                            <DashboardMetricTile
                                label="IN-STORE"
                                value={activeUsers}
                                subtitle="real-time users"
                                icon="people"
                                loading={metricsLoading}
                            />
                            <DashboardMetricTile
                                label="TOTAL SCANNED"
                                value={todayTransactions}
                                subtitle="Redeemed today"
                                icon="receipt-long"
                                loading={metricsLoading}
                            />
                        </View>

                        {/* user retention chart */}
                        <DashboardRetentionChart
                            data={retention}
                            loading={metricsLoading}
                        />

                        <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
                            <View className="flex-row justify-between items-start mb-5">
                                <View>
                                    <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                                        Weekly Scan Activity
                                    </Text>
                                    <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5">
                                        {weekRange}
                                    </Text>
                                </View>
                            </View>
                            <DashboardActivityChart
                                data={weeklyActivity}
                                labels={dayLabels}
                                loading={metricsLoading}
                            />
                        </View>

                        <DashboardStampDistribution
                            buckets={stampBuckets}
                            maxStamps={stampMaxStamps}
                            loading={metricsLoading}
                        />
                    </View>
                ) : (
                    <View className="py-10 items-center">
                        <Text className="font-poppins text-textPrimary">
                            No stores available.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}