import React, { useState, useCallback, useMemo, useRef } from "react";
import { RefreshControl, Platform, ScrollView as RNScrollView } from "react-native";
import { ScrollView, View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { MapPin, Users, ScanLine, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";

import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useStoreDashboardMetrics } from "@/hooks/store-manager/use-store-metrics";
import { getLast7Labels, getWeekDateRange, getLast14Labels, get14DayDateRange } from "@/utils/date-helpers";

import { StorePickerDropdown } from "@/components/stores/store-picker-dropdown";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardRetentionChart } from "@/components/stores/dashboard-retention-chart";
import { DashboardStampDistribution } from "@/components/stores/dashboard-stamp-distribution";
import { DashboardDetailedMetrics } from "@/components/stores/dashboard-detailed-metrics";

export default function StoreManagerDashboard() {
  const { t: translate } = useTranslation();
  const metricScrollRef = useRef<RNScrollView>(null);
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
    retention,
    stampBuckets,
    stampMaxStamps,
    recentTransactions,
    loading: metricsLoading,
    refresh: refreshMetrics,
  } = useStoreDashboardMetrics(
    selectedStore?.id ?? 0,
    selectedStore?.radius ?? 100
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(true), refreshMetrics(false)]);
  }, [refresh, refreshMetrics]);

  const dayLabels = useMemo(() => isWeb ? getLast14Labels() : getLast7Labels(), [isWeb]);
  const weekRange = useMemo(() => isWeb ? get14DayDateRange() : getWeekDateRange(), [isWeb]);

  const displayActivity = useMemo(() => {
    if (isWeb) return weeklyActivity;
    // On mobile, just show the last 7 days for all metrics
    return {
      scans: weeklyActivity.scans.slice(-7),
      unique_visitors: weeklyActivity.unique_visitors.slice(-7),
      redemptions: weeklyActivity.redemptions.slice(-7),
      new_members: weeklyActivity.new_members.slice(-7),
      points_earned: weeklyActivity.points_earned.slice(-7),
    };
  }, [weeklyActivity, isWeb]);

  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);
  const TILE_WIDTH = 276; // 260 width + 16 gap

  const handleMetricScroll = (direction: 'left' | 'right') => {
    let newIndex = direction === 'left' ? scrollIndex - 1 : scrollIndex + 1;
    newIndex = Math.max(0, Math.min(newIndex, 3)); // Max 4 tiles, so max index 3
    setScrollIndex(newIndex);
    metricScrollRef.current?.scrollTo({ x: newIndex * TILE_WIDTH, animated: true });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackground"
    >
      {/* page header */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row justify-between items-center">
        <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
          {translate("label.dashboard", "Dashboard")}
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isWeb ? 48 : 20 }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff6600"
            colors={["#ff6600"]}
          />
        }
      >

        {selectedStore ? (
          <View className={`w-full max-w-7xl mx-auto ${isWeb ? 'px-8 pt-6' : 'px-5 pt-2'}`}>

            {isWeb ? (
              /* ─────────── WEB LAYOUT ─────────── */
              <>
                {/* Row 1: KPI Tiles with Horizontal Slider on Small Web Views */}
                <View className="relative flex-row items-center mb-6">
                  {/* Left Arrow for Slider */}
                  {containerWidth < 1100 && (
                    <TouchableOpacity 
                      onPress={() => handleMetricScroll('left')}
                      className={`absolute -left-5 z-10 p-1 bg-white dark:bg-darkBackgroundCard rounded-full shadow-md border border-slate-100 dark:border-darkBorder ${scrollIndex === 0 ? 'opacity-30' : 'opacity-100'}`}
                      disabled={scrollIndex === 0}
                    >
                      <ChevronLeft size={16} color="#FF6600" />
                    </TouchableOpacity>
                  )}

                  <RNScrollView 
                    ref={metricScrollRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={containerWidth < 1100}
                    style={{ width: '100%' }}
                    contentContainerStyle={containerWidth >= 1100 ? { flex: 1, gap: 16 } : { gap: 16, paddingRight: 40 }}
                  >
                    <View style={containerWidth < 1100 ? { width: 260 } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.inStore", "Active Users")}
                        value={activeUsers}
                        icon={Users}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: 260 } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.totalScanned", "Today's Scans")}
                        value={todayTransactions}
                        icon={ScanLine}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: 260 } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.returning", "Returning Users")}
                        value={`${retention.returningPercent}%`}
                        icon={Users}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: 260 } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.newUsers", "New Users")}
                        value={`${retention.newPercent}%`}
                        icon={ScanLine}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                  </RNScrollView>

                  {/* Right Arrow for Slider */}
                  {containerWidth < 1100 && (
                    <TouchableOpacity 
                      onPress={() => handleMetricScroll('right')}
                      className={`absolute -right-5 z-10 p-1 bg-white dark:bg-darkBackgroundCard rounded-full shadow-md border border-slate-100 dark:border-darkBorder ${scrollIndex >= 3 ? 'opacity-30' : 'opacity-100'}`}
                      disabled={scrollIndex >= 3}
                    >
                      <ChevronRight size={16} color="#FF6600" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Row 2: Main Chart (65%) | Right Sidebar (35%) */}
                <View 
                  className={`${containerWidth > 950 ? 'flex-row' : 'flex-col'} gap-6 mb-6`} 
                >
                  {/* Left – Activity Chart */}
                  <View style={containerWidth > 950 ? { flex: 2, height: 504 } : { width: '100%' }}>
                    <DashboardActivityChart
                      title={containerWidth > 950 
                        ? translate("store_manager.dashboard.activity.title", "Activity Overview")
                        : translate("store_manager.dashboard.activity.titleShort", "Activity")
                      }
                      data={displayActivity}
                      labels={dayLabels}
                      loading={metricsLoading}
                      weekRange={weekRange}
                    />
                  </View>

                  {/* Right Sidebar – Retention + Stamp stacked vertically */}
                  <View 
                    style={containerWidth > 950 ? { flex: 1 } : { width: '100%' }}
                    className="flex-col gap-6"
                  >
                    <View style={{ height: 240 }}>
                      <DashboardRetentionChart
                        data={retention}
                        loading={metricsLoading}
                      />
                    </View>
                    <View style={{ height: 240 }}>
                      <DashboardStampDistribution
                        buckets={stampBuckets}
                        maxStamps={stampMaxStamps}
                        loading={metricsLoading}
                      />
                    </View>
                  </View>
                </View>

                {/* Row 3: Recent Transactions (full width) */}
                <DashboardDetailedMetrics
                  transactions={recentTransactions}
                  loading={metricsLoading}
                />
              </>
            ) : (
              /* ─────────── MOBILE LAYOUT ─────────── */
              <>
                {/* Top row: Retention (50%) | Metrics stacked (50%) */}
                <View className="flex-row gap-[10px] mb-[14px]">
                  <View className="flex-1">
                    <DashboardRetentionChart
                      data={retention}
                      loading={metricsLoading}
                    />
                  </View>
                  <View className="flex-1 flex-col gap-[10px]">
                    <View className="flex-1">
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.inStore", "Active Users")}
                        value={activeUsers}
                        icon={Users}
                        loading={metricsLoading}
                      />
                    </View>
                    <View className="flex-1">
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.totalScanned", "Today's Scans")}
                        value={todayTransactions}
                        icon={ScanLine}
                        loading={metricsLoading}
                      />
                    </View>
                  </View>
                </View>

                {/* Activity Chart */}
                <DashboardActivityChart
                  title={translate("store_manager.dashboard.activity.title", "Weekly Activity")}
                  data={displayActivity}
                  labels={dayLabels}
                  loading={metricsLoading}
                  weekRange={weekRange}
                />

                {/* Stamp Distribution */}
                <DashboardStampDistribution
                  buckets={stampBuckets}
                  maxStamps={stampMaxStamps}
                  loading={metricsLoading}
                />

                {/* Recent Transactions */}
                <DashboardDetailedMetrics
                  transactions={recentTransactions}
                  loading={metricsLoading}
                />
              </>
            )}
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
