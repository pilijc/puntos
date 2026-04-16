import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { Users, Store, Activity, CalendarDays } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { SubscriptionDistribution } from "@/components/super-admin/subscription-distribution";
import { WEB_PAGE_PADDING, WEB_CARD_PADDING, WEB_CARD_MAX_WIDTH } from "@/type/super-admin/layout";

const isWeb = Platform.OS === "web";
type Timeframe = "today" | "7d" | "1m";

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function parsePossibleDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getItemDate(item: any, dateKeys: string[]) {
  return dateKeys.map((key) => parsePossibleDate(item?.[key])).find((d) => d != null) ?? null;
}

function buildTimeframeSeries(items: any[], dateKeys: string[], timeframe: Timeframe) {
  const now = new Date();
  const today = startOfDay(now);

  const series = Array.from({ length: 7 }, () => 0);
  const labels = Array.from({ length: 7 }, (_, i) => `${i + 1}`);

  const windowDays = timeframe === "today" ? 1 : timeframe === "7d" ? 7 : 30;
  const bucketSize = timeframe === "1m" ? Math.ceil(windowDays / 7) : 1;

  items.forEach((item) => {
    const found = getItemDate(item, dateKeys);
    if (!found) return;
    const diffDays = Math.floor((today.getTime() - startOfDay(found).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays >= windowDays) return;

    if (timeframe === "today") {
      series[6] += 1;
      return;
    }

    if (timeframe === "7d") {
      const idx = 6 - diffDays;
      series[idx] += 1;
      return;
    }

    const bucketFromStart = Math.floor((windowDays - 1 - diffDays) / bucketSize);
    const idx = Math.min(6, Math.max(0, bucketFromStart));
    series[idx] += 1;
  });

  if (timeframe === "today") {
    const day = now.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    return {
      series,
      labels: ["", "", "", "", "", "", day],
      rangeLabel: "Today",
    };
  }

  if (timeframe === "7d") {
    const dynamicLabels = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const rangeLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    return { series, labels: dynamicLabels, rangeLabel };
  }

  const monthLabels = Array.from({ length: 7 }, (_, idx) => `W${idx + 1}`);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const rangeLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return { series, labels: monthLabels, rangeLabel };
}

function getActiveUsersCount(users: any[]) {
  return users.filter((u) => !(u?.status === "Blocked" || u?.blocked === true || u?.role === 0)).length;
}

function getDetailItems(items: any[], dateKeys: string[], prefix: string, timeframe: Timeframe) {
  const nowDay = startOfDay(new Date()).getTime();
  const maxDiff = timeframe === "today" ? 0 : timeframe === "7d" ? 6 : 29;

  return items
    .map((item) => ({
      item,
      date: getItemDate(item, dateKeys),
    }))
    .filter(({ date }) => {
      if (!date) return false;
      const diffDays = Math.floor((nowDay - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= maxDiff;
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 30)
    .map(({ item, date }, idx) => {
      const status = item?.blocked === true || item?.role === 0 || String(item?.status ?? "").toLowerCase() === "inactive" ? "Inactive" : "Active";
      const dateLabel = date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A";
      const name =
        item?.name ||
        item?.username ||
        item?.display_name ||
        item?.store_name ||
        item?.title ||
        `${prefix} ${idx + 1}`;
      return {
        key: `${prefix}-${idx}-${item?.id ?? idx}`,
        title: name,
        subtitle: `${dateLabel} • ${status}`,
      };
    });
}

export default function SuperAdminDashboard() {
  const { users, stores, adminInfo, loading, refreshing, activeStoresCount, onRefresh } = useSuperAdminDashboard();
  const { t: translate } = useTranslation();

  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  const activeUsersCount = useMemo(() => getActiveUsersCount(users), [users]);
  const userRetentionPercent = useMemo(() => Math.round((activeUsersCount / Math.max(1, users.length)) * 100), [activeUsersCount, users.length]);

  const userMetrics = useMemo(() => buildTimeframeSeries(users, ["created_at", "createdAt", "inserted_at"], timeframe), [users, timeframe]);
  const storeMetrics = useMemo(() => buildTimeframeSeries(stores, ["created_at", "createdAt", "inserted_at"], timeframe), [stores, timeframe]);
  const combinedSeries = useMemo(() => userMetrics.series.map((v, i) => v + (storeMetrics.series[i] ?? 0)), [userMetrics.series, storeMetrics.series]);

  const peakIndex = useMemo(() => combinedSeries.findIndex((v) => v === Math.max(...combinedSeries, 0)), [combinedSeries]);
  const mostActiveLabel = useMemo(() => userMetrics.labels[peakIndex] ?? "-", [peakIndex, userMetrics.labels]);

  const userList = useMemo(() => getDetailItems(users, ["created_at", "createdAt", "inserted_at"], "User", timeframe), [users, timeframe]);
  const storeList = useMemo(() => getDetailItems(stores, ["created_at", "createdAt", "inserted_at"], "Store", timeframe), [stores, timeframe]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-darkBackground">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
        <View style={isWeb ? { paddingTop: 24, paddingBottom: 12, paddingHorizontal: WEB_PAGE_PADDING } : {}} className="px-6 pt-4 pb-3">
          <Text className="text-sm text-[#94A3B8] dark:text-darkTextSecondary font-[Poppins-Regular]">
            {translate("superAdmin.dashboard.welcome")}
            <Text className="text-orange-500 font-[Poppins-Bold]"> {adminInfo?.username?.split(" ")[0] || "Admin"}</Text>!
          </Text>
          <Text className="text-2xl font-[Poppins-Bold] text-[#0F172A] dark:text-darkTextPrimary">
            {translate("superAdmin.dashboard.title")}
          </Text>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className="px-6 mb-6 mt-2"
        >
          <View className="flex-row gap-2 mb-2">
            <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
            <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
            <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Activity} />
          </View>
          <View className="flex-row gap-[10px]">
            <DashboardMetricTile
              label="Most Active Day"
              value={mostActiveLabel}
              subtitle={timeframe === "today" ? "Today" : timeframe === "7d" ? "Last 7 days" : "Last 30 days"}
              icon={CalendarDays}
              loading={false}
            />
            <DashboardMetricTile label="Returning Customers" value={`${userRetentionPercent}%`} subtitle="Retention rate" icon={Activity} loading={false} />
          </View>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className="px-6 mb-4"
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
                  <Text className={`text-xs font-poppins-bold ${active ? "text-primary" : "text-textMuted dark:text-darkTextMuted"}`}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className={isWeb ? "mb-4" : "mb-4 px-6"}
        >
          <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mb-3">User Analytics</Text>
          <DashboardActivityChart 
            data={userMetrics.series} 
            labels={userMetrics.labels} 
            weekRange={userMetrics.rangeLabel} 
            loading={false}
            showDetails={showUserDetails}
            onToggleDetails={() => setShowUserDetails((prev) => !prev)}
          >
            <ScrollView className="max-h-48">
              {userList.length === 0 ? (
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">No records for this period.</Text>
              ) : (
                userList.map((item) => (
                  <View key={item.key} className="py-2 border-b border-slate-100 dark:border-darkBorder">
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{item.title}</Text>
                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">{item.subtitle}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </DashboardActivityChart>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className={isWeb ? "mb-8" : "mb-8 px-6"}
        >
          <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mb-3">Store Analytics</Text>
          <DashboardActivityChart 
            data={storeMetrics.series} 
            labels={storeMetrics.labels} 
            weekRange={storeMetrics.rangeLabel} 
            loading={false}
            showDetails={showStoreDetails}
            onToggleDetails={() => setShowStoreDetails((prev) => !prev)}
          >
            <ScrollView className="max-h-48">
              {storeList.length === 0 ? (
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">No records for this period.</Text>
              ) : (
                storeList.map((item) => (
                  <View key={item.key} className="py-2 border-b border-slate-100 dark:border-darkBorder">
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{item.title}</Text>
                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">{item.subtitle}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </DashboardActivityChart>
          
          <SubscriptionDistribution />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
