import React, { useState, useCallback, useMemo } from "react";
import { RefreshControl } from "react-native";
import { ScrollView, View, Text, SafeAreaView } from "@/tw";
import { MapPin, Users, ScanLine } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";

import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useStoreDashboardMetrics } from "@/hooks/store-manager/use-store-metrics";
import { getLast7Labels, getWeekDateRange } from "@/utils/date-helpers";

import { StorePickerDropdown } from "@/components/stores/store-picker-dropdown";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardRetentionChart } from "@/components/stores/dashboard-retention-chart";
import { DashboardStampDistribution } from "@/components/stores/dashboard-stamp-distribution";

export default function StoreManagerDashboard() {
    const { t: translate } = useTranslation();
    const {
        stores,
        isFetching: refreshing,
        fetchStores: refresh
    } = useManagerStoresStore();

    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const task = setTimeout(() => {
                refresh(true);
            }, 0);
            return () => clearTimeout(task);
        }, [refresh])
    );

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
        loading: metricsLoading,
        refresh: refreshMetrics
    } = useStoreDashboardMetrics(
        selectedStore?.id ?? 0,
        selectedStore?.latitude ?? null,
        selectedStore?.longitude ?? null,
        selectedStore?.radius ?? 100
    );

    const handleRefresh = useCallback(async () => {
        await Promise.all([
            refresh(true),
            refreshMetrics(false) // false because refreshControl already has its own loader
        ]);
    }, [refresh, refreshMetrics]);

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
                        onRefresh={handleRefresh}
                        tintColor="#ff6600"
                        colors={["#ff6600"]}
                    />
                }
            >
                <View className="mb-[24px]">
                    <View className="flex-row justify-between items-center mb-[4px]">
                        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {translate("storeManager.dashboard.title")}
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
                            <MapPin size={14} color="#94a3b8" />
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
                                label={translate("storeManager.dashboard.metrics.inStore")}
                                value={activeUsers}
                                subtitle={translate("storeManager.dashboard.metrics.realTimeUsers")}
                                icon={Users}
                                loading={metricsLoading}
                            />
                            <DashboardMetricTile
                                label={translate("storeManager.dashboard.metrics.totalScanned")}
                                value={todayTransactions}
                                subtitle={translate("storeManager.dashboard.metrics.redeemedToday")}
                                icon={ScanLine}
                                loading={metricsLoading}
                            />
                        </View>

                        {/* user retention chart */}
                        <DashboardRetentionChart
                            data={retention}
                            loading={metricsLoading}
                        />

                        <DashboardActivityChart
                            data={weeklyActivity}
                            labels={dayLabels}
                            loading={metricsLoading}
                            weekRange={weekRange}
                        />

                        <DashboardStampDistribution
                            buckets={stampBuckets}
                            maxStamps={stampMaxStamps}
                            loading={metricsLoading}
                        />
                    </View>
                ) : (
                    <View className="py-10 items-center">
                        <Text className="font-poppins text-textPrimary">
                            {translate("storeManager.dashboard.noStores")}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}