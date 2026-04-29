import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, Store, Activity, CalendarDays, MessageSquare } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { useSupportChatStore } from "@/store/support-chat-store";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { SubscriptionDistribution } from "@/components/super-admin/subscription-distribution";
import { DashboardActivityLineChart } from "@/components/super-admin/dashboard-activity-line-chart";
import {
  buildTimeframeSeries,
  getDetailItems,
  Timeframe,
  USER_DATE_KEYS,
  STORE_DATE_KEYS,
} from "@/services/super-admin/dashboard-analytics-service";


const isWeb = Platform.OS === "web";

export default function SuperAdminDashboard() {
  const { users, stores, adminInfo, loading, refreshing, activeStoresCount, onRefresh } = useSuperAdminDashboard();
  const { conversations, loadAdminConversations, subscribeInbox, cleanupRealtime } = useSupportChatStore();
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Two-column layout only when the content area is wide enough
  const showTwoColumns = isWeb && windowWidth >= 1024;
  const rightColWidth = windowWidth >= 1280 ? 360 : 300;

  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [showDetails, setShowDetails] = useState(false);
  const [userLimit, setUserLimit] = useState(5);
  const [storeLimit, setStoreLimit] = useState(5);
  const [payerLimit, setPayerLimit] = useState(5);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_admin_count ?? 0), 0),
    [conversations]
  );

  useEffect(() => {
    loadAdminConversations();
    subscribeInbox();
    return () => cleanupRealtime();
  }, []);

  useEffect(() => {
    setUserLimit(5);
    setStoreLimit(5);
    setPayerLimit(5);
  }, [timeframe]);



  const userMetrics = useMemo(() => buildTimeframeSeries(users, USER_DATE_KEYS, timeframe), [users, timeframe]);
  const storeMetrics = useMemo(() => buildTimeframeSeries(stores, STORE_DATE_KEYS, timeframe), [stores, timeframe]);
  const combinedSeries = useMemo(
    () => userMetrics.series.map((v, i) => v + (storeMetrics.series[i] ?? 0)),
    [userMetrics.series, storeMetrics.series]
  );



  const peakIndex = useMemo(() => {
    const peak = Math.max(...combinedSeries, 0);
    return combinedSeries.findIndex((v) => v === peak);
  }, [combinedSeries]);
  const mostActiveLabel = useMemo(() => userMetrics.labels[peakIndex] ?? "-", [peakIndex, userMetrics.labels]);

  const userList = useMemo(() => getDetailItems(users, USER_DATE_KEYS, "User", timeframe, userLimit), [users, timeframe, userLimit]);
  const storeList = useMemo(() => getDetailItems(stores, STORE_DATE_KEYS, "Store", timeframe, storeLimit), [stores, timeframe, storeLimit]);

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
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
        {!isWeb && (
          <View className="pt-1 pb-2">
            <Text className="text-sm text-[#94A3B8] dark:text-darkTextSecondary font-poppins">
              {translate("superAdmin.dashboard.welcome")}
              <Text className="text-orange-500 font-poppins-bold">
                {adminInfo?.username?.split(" ")[0] || "Admin"}
              </Text>!
            </Text>
          </View>
        )}

        {showTwoColumns ? (
          <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}>
            {/* Left column */}
            <View style={{ flex: 1 }}>
              <View className="mb-6 mt-4">
                <View className="flex-row gap-4 mb-4">
                  <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
                  <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
                  <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Activity} />
                </View>
                <View className="flex-row gap-[16px]">
                  <DashboardMetricTile
                    label={timeframe === "today" ? translate("superAdmin.dashboard.peakHour") : timeframe === "7d" ? translate("superAdmin.dashboard.mostActiveDay") : translate("superAdmin.dashboard.mostActiveWeek")}
                    value={mostActiveLabel}
                    subtitle={timeframe === "today" ? translate("superAdmin.dashboard.rangeToday") : timeframe === "7d" ? translate("superAdmin.dashboard.rangeLast7") : translate("superAdmin.dashboard.rangeLast30")}
                    icon={CalendarDays}
                    loading={false}
                  />
                </View>
              </View>
              <View className="mb-4">
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
            </View>
            {/* Right column */}
            <View style={{ width: rightColWidth }} className="mt-4">
              <SubscriptionDistribution
                timeframe={timeframe}
                payerLimit={payerLimit}
                onLoadMorePayers={() => setPayerLimit(p => p + 5)}
                onResetPayers={() => setPayerLimit(5)}
              />
            </View>
          </View>
        ) : (
          <>
            <View className="mb-8 mt-4">
              <View className="flex-row gap-4 mb-6">
                <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
                <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
                <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Activity} />
              </View>
              <View className="flex-row gap-[10px]">
                <DashboardMetricTile
                  label={timeframe === "today" ? translate("superAdmin.dashboard.peakHour") : timeframe === "7d" ? translate("superAdmin.dashboard.mostActiveDay") : translate("superAdmin.dashboard.mostActiveWeek")}
                  value={mostActiveLabel}
                  subtitle={timeframe === "today" ? translate("superAdmin.dashboard.rangeToday") : timeframe === "7d" ? translate("superAdmin.dashboard.rangeLast7") : translate("superAdmin.dashboard.rangeLast30")}
                  icon={CalendarDays}
                  loading={false}
                />
              </View>
            </View>
            <View className="mb-4">
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
            <SubscriptionDistribution
              timeframe={timeframe}
              payerLimit={payerLimit}
              onLoadMorePayers={() => setPayerLimit(p => p + 5)}
              onResetPayers={() => setPayerLimit(5)}
            />
          </>
        )}
      </ScrollView>

      {/* Floating Action Button for Chat */}
      <TouchableOpacity
        onPress={() => router.push("/(super_admin)/inbox" as any)}
        className="w-14 h-14 bg-[#FFF0E6] rounded-full items-center justify-center z-50 border border-[#FFD4B5]"
        style={isWeb
          ? { position: 'fixed' as any, bottom: 24, right: 24 }
          : { position: 'absolute', bottom: Math.max(insets.bottom, 8) + 4, right: 24 }
        }
      >
        <MessageSquare size={24} color="#FF6600" />
        {totalUnread > 0 && (
          <View className="absolute top-0 -right-1 w-[22px] h-[22px] bg-red-500 rounded-full border-2 border-white items-center justify-center">
            <Text className="text-[10px] font-poppins-bold text-white mt-0.5">
              {totalUnread > 9 ? "9+" : totalUnread}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
