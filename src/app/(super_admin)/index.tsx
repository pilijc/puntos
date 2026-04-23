import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { Users, Store, Activity, CalendarDays } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { SubscriptionDistribution } from "@/components/super-admin/subscription-distribution";
import { DashboardActivityLineChart } from "@/components/super-admin/dashboard-activity-line-chart";
import { 
  buildTimeframeSeries, 
  getActiveUsersCount, 
  getDetailItems, 
  Timeframe 
} from "@/services/super-admin/dashboard-analytics-service";

const isWeb = Platform.OS === "web";

export default function SuperAdminDashboard() {
  const { users, stores, adminInfo, loading, refreshing, activeStoresCount, onRefresh } = useSuperAdminDashboard();
  const { t: translate } = useTranslation();

  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [showDetails, setShowDetails] = useState(false);
  const [userLimit, setUserLimit] = useState(5);
  const [storeLimit, setStoreLimit] = useState(5);

  useEffect(() => {
    setUserLimit(5);
    setStoreLimit(5);
  }, [timeframe]);

  const activeUsersCount = useMemo(() => getActiveUsersCount(users), [users]);
  const userRetentionPercent = useMemo(() => Math.round((activeUsersCount / Math.max(1, users.length)) * 100), [activeUsersCount, users.length]);

  const userMetrics = useMemo(() => buildTimeframeSeries(users, ["last_sign_in_at", "last_login", "last_login_at", "last_sign_in", "updated_at", "created_at", "createdAt", "inserted_at"], timeframe), [users, timeframe]);
  const storeMetrics = useMemo(() => buildTimeframeSeries(stores, ["updated_at", "created_at", "createdAt", "inserted_at"], timeframe), [stores, timeframe]);
  const combinedSeries = useMemo(() => userMetrics.series.map((v, i) => v + (storeMetrics.series[i] ?? 0)), [userMetrics.series, storeMetrics.series]);

  const peakIndex = useMemo(() => combinedSeries.findIndex((v) => v === Math.max(...combinedSeries, 0)), [combinedSeries]);
  const mostActiveLabel = useMemo(() => userMetrics.labels[peakIndex] ?? "-", [peakIndex, userMetrics.labels]);

  const userList = useMemo(() => getDetailItems(users, ["last_sign_in_at", "last_login", "last_login_at", "last_sign_in", "updated_at", "created_at", "createdAt", "inserted_at"], "User", timeframe, userLimit), [users, timeframe, userLimit]);
  const storeList = useMemo(() => getDetailItems(stores, ["updated_at", "created_at", "createdAt", "inserted_at"], "Store", timeframe, storeLimit), [stores, timeframe, storeLimit]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-darkBackground">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground" edges={["top", "left", "right"]}>
      {/* ── Main Header (Uniform Style) ── */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
            {translate("superAdmin.dashboard.title")}
          </Text>
          {isWeb && (
            <Text className="text-xs text-[#94A3B8] dark:text-darkTextSecondary font-poppins">
              {translate("superAdmin.dashboard.welcome")}
              <Text className="text-orange-500 font-poppins-bold">
                {adminInfo?.username?.split(" ")[0] || "Admin"}
              </Text>!
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
          ...(isWeb ? {
            paddingHorizontal: 16,
            paddingTop: 16,
            alignItems: "center" as const
          } : {}),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
        <View style={isWeb ? { maxWidth: 896, width: "100%" } : {}} className={isWeb ? "w-full" : ""}>
          {/* ── Sub-Header (Welcome Message) ── */}
          {!isWeb && (
            <View className="px-6 pt-6 pb-2">
              <Text className="text-sm text-[#94A3B8] dark:text-darkTextSecondary font-poppins">
                {translate("superAdmin.dashboard.welcome")}
                <Text className="text-orange-500 font-poppins-bold">
                  {adminInfo?.username?.split(" ")[0] || "Admin"}
                </Text>!
              </Text>
            </View>
          )}

          <View
            className={isWeb ? "mb-6 mt-2" : "px-6 mb-6 mt-2"}
          >
            <View className="flex-row gap-2 mb-2">
              <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
              <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
              <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Activity} />
            </View>
            <View className="flex-row gap-[10px]">
              <DashboardMetricTile
                label={timeframe === "today" ? "Peak Hour" : timeframe === "7d" ? "Most Active Day" : "Most Active Week"}
                value={mostActiveLabel}
                subtitle={timeframe === "today" ? "Today" : timeframe === "7d" ? "Last 7 days" : "Last 30 days"}
                icon={CalendarDays}
                loading={false}
              />
              <DashboardMetricTile label="Returning Customers" value={`${userRetentionPercent}%`} subtitle="Retention rate" icon={Activity} loading={false} />
            </View>
          </View>

          <View
            className={isWeb ? "mb-4" : "px-6 mb-4"}
          >
            <View className="flex-row rounded-xl bg-[#EEF2F7] dark:bg-darkBackgroundMuted p-1 self-start">
              {([
                { id: "today", label: "Today" },
                { id: "7d", label: "7d" },
                { id: "1m", label: "1m" },
              ] as Array<{ id: Timeframe; label: string }>).map((opt) => {
                const active = timeframe === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setTimeframe(opt.id)}
                    className={`px-4 py-1.5 rounded-lg ${active ? "bg-white dark:bg-darkBackgroundCard" : ""}`}
                  >
                    <Text className={`text-[11px] font-poppins-bold ${active ? "text-primary" : "text-textMuted dark:text-darkTextMuted"}`}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <DashboardActivityLineChart
            userSeries={userMetrics.series}
            storeSeries={storeMetrics.series}
            labels={userMetrics.labels}
            weekRange={userMetrics.rangeLabel}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails(!showDetails)}
            userList={userList}
            storeList={storeList}
            onLoadMoreUsers={() => setUserLimit(p => p + 5)}
            onLoadMoreStores={() => setStoreLimit(p => p + 5)}
            onResetUsers={() => setUserLimit(5)}
            onResetStores={() => setStoreLimit(5)}
          />

          <SubscriptionDistribution />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
