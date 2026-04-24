import React, { useState, useCallback, useMemo } from "react";
import { RefreshControl, Platform } from "react-native";
import { ScrollView, View, Text, SafeAreaView } from "@/tw";
import { MapPin, Users, ScanLine, Activity, Clock } from "lucide-react-native";
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
import { DashboardDetailedMetrics } from "@/components/stores/dashboard-detailed-metrics";

export default function StoreManagerDashboard() {
  const { t: translate } = useTranslation();
  const {
    stores,
    isFetching: refreshing,
    fetchStores: refresh,
  } = useManagerStoresStore();

  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const isWeb = Platform.OS === "web";

  useFocusEffect(
    useCallback(() => {
      const task = setTimeout(() => refresh(true), 0);
      return () => clearTimeout(task);
    }, [refresh]),
  );

  React.useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const selectedStore =
    stores.find((s) => s.id === selectedStoreId) || stores[0];

  const {
    activeUsers,
    todayTransactions,
    weeklyActivity,
    avgDailyScans,
    peakHour,
    retention,
    stampBuckets,
    stampMaxStamps,
    recentTransactions,
    loading: metricsLoading,
    refresh: refreshMetrics,
  } = useStoreDashboardMetrics(
    selectedStore?.id ?? 0,
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(true), refreshMetrics(false)]);
  }, [refresh, refreshMetrics]);

  const dayLabels = useMemo(() => getLast7Labels(), []);
  const weekRange = useMemo(() => getWeekDateRange(), []);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackground"
    >
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          {translate("label.dashboard", "Dashboard")}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isWeb ? 32 : 20 }}
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
        <View className="bg-backgroundMuted dark:bg-darkBackground px-6 pt-4 pb-3">
          <View className="flex-row justify-between items-center gap-3">
            {selectedStore?.address ? (
              <View className="flex-1 flex-row items-center min-w-0 pr-2">
                <MapPin size={14} color="#94a3b8" />
                <Text
                  className="text-xs font-poppins text-textMuted dark:text-darkTextMuted ml-[4px] flex-shrink"
                  numberOfLines={3}
                >
                  {selectedStore.address}
                </Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}
            <StorePickerDropdown
              stores={stores}
              selectedStore={selectedStore}
              isVisible={isDropdownVisible}
              onOpen={() => setDropdownVisible(true)}
              onClose={() => setDropdownVisible(false)}
              onSelect={(id) => setSelectedStoreId(id)}
            />
          </View>
        </View>

        {selectedStore ? (
          <View className={`w-full mb-8 max-w-7xl mx-auto ${isWeb ? 'px-8 pt-4' : 'px-5 pt-2'}`}>
            {/* TOP METRICS & RETENTION */}
            <View className="flex-row gap-[10px] mb-[14px]">
              {/* Left: Retention Chart (50%) */}
              <View className="flex-1">
                <DashboardRetentionChart
                  data={retention}
                  loading={metricsLoading}
                />
              </View>

              {/* Right: Top Metrics vertically stacked (50%) */}
              <View className="flex-1 flex-col gap-[10px]">
                <View className="flex-1">
                  <DashboardMetricTile
                    label={translate(
                      "store_manager.dashboard.metrics.inStore",
                      "Active Users",
                    )}
                    value={activeUsers}
                    icon={Users}
                    loading={metricsLoading}
                  />
                </View>
                
                <View className="flex-1">
                  <DashboardMetricTile
                    label={translate(
                      "store_manager.dashboard.metrics.totalScanned",
                      "Today's Scans",
                    )}
                    value={todayTransactions}
                    icon={ScanLine}
                    loading={metricsLoading}
                  />
                </View>
              </View>
            </View>

            {/* WEB ONLY: Extra Metric Tiles */}
            {isWeb && (
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <DashboardMetricTile
                    label="Avg. Daily Scans"
                    value={avgDailyScans}
                    icon={Activity}
                    loading={metricsLoading}
                  />
                </View>
                <View className="flex-1">
                  <DashboardMetricTile
                    label="Peak Hours"
                    value={peakHour}
                    icon={Clock}
                    loading={metricsLoading}
                  />
                </View>
              </View>
            )}

            {/* CHARTS - column layout on Mobile, grid on web */}
            <View className="flex-col md:flex-row md:gap-4">
              {/* Left Column (Main Graph) */}
              <View className="w-full md:flex-[2]">
                <DashboardActivityChart
                  title={translate(
                    "store_manager.dashboard.activity.title",
                    "Weekly Activity",
                  )}
                  data={weeklyActivity}
                  labels={dayLabels}
                  loading={metricsLoading}
                  weekRange={weekRange}
                />
              </View>

              {/* Right Column (Secondary Graphs) */}
              <View className="w-full md:flex-[1]">
                <DashboardStampDistribution
                  buckets={stampBuckets}
                  maxStamps={stampMaxStamps}
                  loading={metricsLoading}
                />
              </View>
            </View>

            {/* BOTTOM: Detailed Metrics (Visible on all platforms) */}
            <DashboardDetailedMetrics 
              transactions={recentTransactions}
              loading={metricsLoading}
            />
          </View>
        ) : (
          <View className="py-10 items-center">
            <Text className="font-poppins text-textPrimary">
              {translate(
                "store_manager.dashboard.noStores",
                "No Stores Available",
              )}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}