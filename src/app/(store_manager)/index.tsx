import React from "react";
import { RefreshControl, ScrollView as RNScrollView } from "react-native";
import { ScrollView, View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { Users, ScanLine, ChevronLeft, ChevronRight, Store, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

import { useStoreDashboard } from "@/hooks/store-manager/use-store-metrics";

import { StorePickerDropdown } from "@/components/stores/store-picker-dropdown";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardRetentionChart } from "@/components/stores/dashboard-retention-chart";
import { DashboardStampDistribution } from "@/components/stores/dashboard-stamp-distribution";
import { DashboardDetailedMetrics } from "@/components/stores/dashboard-detailed-metrics";

export default function StoreManagerDashboard() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const {
    isWeb,
    stores,
    selectedStore,
    setSelectedStoreId,
    isDropdownVisible,
    setDropdownVisible,
    refreshing,
    handleRefresh,
    activeUsers,
    todayTransactions,
    retention,
    stampBuckets,
    stampMaxStamps,
    recentTransactions,
    metricsLoading,
    dayLabels,
    weekRange,
    displayActivity,
    containerWidth,
    setContainerWidth,
    scrollIndex,
    handleMetricScroll,
    metricScrollRef,
  } = useStoreDashboard();

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
          <View className={`w-full max-w-7xl mx-auto ${isWeb ? (containerWidth > 600 ? 'px-8 pt-6' : 'px-4 pt-4') : 'px-5 pt-2'}`}>

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
                    <View style={containerWidth < 1100 ? { width: Math.min(240, Math.max(containerWidth - 32, 160)) } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={`${translate("store_manager.dashboard.metrics.inStore", "Active Users")} (${selectedStore?.radius ?? 100}m)`}
                        value={activeUsers}
                        icon={Users}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: Math.min(240, Math.max(containerWidth - 32, 160)) } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.totalScanned", "Today's Scans")}
                        value={todayTransactions}
                        icon={ScanLine}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: Math.min(240, Math.max(containerWidth - 32, 160)) } : { flex: 1 }}>
                      <DashboardMetricTile
                        label={translate("store_manager.dashboard.metrics.returning", "Returning Users")}
                        value={`${retention.returningPercent}%`}
                        icon={Users}
                        loading={metricsLoading}
                        compact={containerWidth < 1200}
                      />
                    </View>
                    <View style={containerWidth < 1100 ? { width: Math.min(240, Math.max(containerWidth - 32, 160)) } : { flex: 1 }}>
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
                    <View style={containerWidth > 950 ? { height: 240 } : { minHeight: 180 }}>
                      <DashboardRetentionChart
                        data={retention}
                        loading={metricsLoading}
                      />
                    </View>
                    <View style={containerWidth > 950 ? { height: 240 } : { minHeight: 180 }}>
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
                  storeId={selectedStore?.id ?? 0}
                  transactions={recentTransactions}
                  loading={metricsLoading}
                />
              </>
            ) : (
              /* ─────────── MOBILE LAYOUT ─────────── */
              <View className="flex-col gap-[14px]">
                {/* Top row: Retention (50%) | Metrics stacked (50%) */}
                <View className="flex-row gap-[10px]">
                  <View className="flex-1">
                    <DashboardRetentionChart
                      data={retention}
                      loading={metricsLoading}
                    />
                  </View>
                  <View className="flex-1 flex-col gap-[10px]">
                    <View className="flex-1">
                      <DashboardMetricTile
                        label={`${translate("store_manager.dashboard.metrics.inStore", "Active Users")} (${selectedStore?.radius ?? 100}m)`}
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
                  storeId={selectedStore?.id ?? 0}
                  transactions={recentTransactions}
                  loading={metricsLoading}
                />
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20 px-6 mt-10">
            <View className="w-24 h-24 bg-orange-50 dark:bg-[#431407] rounded-full items-center justify-center mb-6">
              <Store size={48} color="#FF6600" />
            </View>
            <Text className="text-2xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center mb-3">
              {translate("store_manager.dashboard.noStores", "Let's Grow Your Business!")}
            </Text>
            <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary text-center max-w-sm mb-8 leading-6">
              {translate("store_manager.dashboard.noStoresDesc", "Create your first store to start rewarding loyal customers, tracking insights, and boosting your sales.")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(store_manager)/store/create-store" as any)}
              className="bg-[#FF6600] flex-row items-center px-6 py-3.5 rounded-xl shadow-sm"
            >
              <Plus size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-white font-poppins-bold text-sm">
                {translate("store_manager.dashboard.createStore", "Create My First Store")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
