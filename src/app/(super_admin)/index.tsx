import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Activity, CalendarDays, Eye, EyeOff, MessageSquare, RotateCcw, Store, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { DashboardActivityChart } from "@/components/stores/dashboard-activity-chart";
import { DashboardMetricTile } from "@/components/stores/dashboard-metric-tile";
import { SubscriptionDistribution } from "@/components/super-admin/subscription-distribution";
import { WEB_CARD_PADDING, WEB_CARD_MAX_WIDTH } from "@/type/super-admin/layout";

const isWeb = Platform.OS === "web";
type Timeframe = "today" | "7d" | "1m";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function getItemDate(item: any, dateKeys: string[]): Date | null {
  if (!item) return null;
  const itemKeys = Object.keys(item);
  for (const key of dateKeys) {
    const matchingKey = itemKeys.find(k => k.toLowerCase() === key.toLowerCase());
    if (matchingKey) {
      const d = parsePossibleDate(item[matchingKey]);
      if (d) return d;
    }
  }
  return null;
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

    const rawBucket = Math.floor(diffDays / bucketSize);
    const idx = Math.min(6, Math.max(0, 6 - rawBucket));
    series[idx] += 1;
  });

  if (timeframe === "today") {
    const day = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
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
      return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    });
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const rangeLabel = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} — ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
    return { series, labels: dynamicLabels, rangeLabel };
  }

  const monthLabels = Array.from({ length: 7 }, (_, idx) => `Week ${idx + 1}`);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const rangeLabel = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} — ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  return { series, labels: monthLabels, rangeLabel };
}

function getActiveUsersCount(users: any[]) {
  return users.filter((u) => !(u?.status === "Blocked" || u?.blocked === true || u?.role === 0)).length;
}

function getDetailItems(items: any[], dateKeys: string[], prefix: string, timeframe: Timeframe, limit: number = 5) {
  const nowDay = startOfDay(new Date()).getTime();
  const maxDiff = timeframe === "today" ? 0 : timeframe === "7d" ? 6 : 29;

  const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
  const allFiltered = uniqueItems
    .map((item) => ({
      item,
      date: getItemDate(item, dateKeys),
    }))
    .filter(({ date }) => {
      if (!date) return false;
      const diffDays = Math.floor((nowDay - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= maxDiff;
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const list = allFiltered.slice(0, limit).map(({ item, date }, idx) => {
    const status =
      item?.blocked === true ||
        item?.role === 0 ||
        String(item?.status ?? "").toLowerCase() === "inactive"
        ? "Inactive"
        : "Active";
    const dateLabel = date
      ? `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
      : "N/A";
    const name =
      item?.name ||
      item?.username ||
      item?.display_name ||
      item?.store_name ||
      item?.title ||
      (prefix === "User" ? "Unknown User" : `${prefix} ${idx + 1}`);
    return {
      key: `${prefix}-${idx}-${item?.id ?? idx}`,
      title: name,
      subtitle: `${dateLabel} • ${status}`,
    };
  });

  return { list, hasMore: allFiltered.length > limit };
}

const USER_DATE_KEYS = ["created_at", "createdAt", "last_sign_in_at", "updated_at"];
const STORE_DATE_KEYS = ["created_at", "createdAt", "updated_at", "approved_at"];

export default function SuperAdminDashboard() {
  const { users, stores, adminInfo, loading, refreshing, activeStoresCount, onRefresh } = useSuperAdminDashboard();
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();

  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [userLimit, setUserLimit] = useState(5);
  const [storeLimit, setStoreLimit] = useState(5);

  useEffect(() => {
    setUserLimit(5);
    setStoreLimit(5);
  }, [timeframe]);

  const returningUsersCount = useMemo(() => {
    return users.filter(u => {
      const lastSignIn = u.last_sign_in_at;
      const createdAt = u.created_at;
      if (!lastSignIn || !createdAt) return false;
      const diff = new Date(lastSignIn).getTime() - new Date(createdAt).getTime();
      return diff > 24 * 60 * 60 * 1000;
    }).length;
  }, [users]);

  const userRetentionPercent = useMemo(
    () => Math.round((returningUsersCount / Math.max(1, users.length)) * 100),
    [returningUsersCount, users.length]
  );

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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
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
                  <Text className={`text-[11px] font-poppins-bold ${active ? "text-primary" : "text-textMuted dark:text-darkTextMuted"}`}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className={isWeb ? "mb-4" : "mb-4 px-6"}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary">User Analytics</Text>
            <TouchableOpacity
              onPress={() => setShowUserDetails(prev => !prev)}
              className="flex-row items-center bg-slate-50 dark:bg-darkBackgroundMuted px-3 py-1.5 rounded-full border border-slate-100 dark:border-darkBorder"
            >
              {showUserDetails ? <EyeOff size={12} color="#475569" /> : <Eye size={12} color="#475569" />}
              <Text className="text-[10px] font-poppins-bold text-slate-600 dark:text-darkTextPrimary ml-1.5">
                {showUserDetails ? "Hide Details" : "View Details"}
              </Text>
            </TouchableOpacity>
          </View>
          <DashboardActivityChart
            data={userMetrics.series}
            labels={userMetrics.labels}
            weekRange={userMetrics.rangeLabel}
            loading={false}
            showDetails={showUserDetails}
          >
            <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
              {userList.list.length === 0 ? (
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">No records for this period.</Text>
              ) : (
                <>
                  {userLimit > 5 && (
                    <TouchableOpacity
                      onPress={() => setUserLimit(5)}
                      className="py-2 flex-row items-center justify-end"
                    >
                      <RotateCcw size={12} color="#FF6600" />
                      <Text className="text-[11px] font-poppins-bold text-primary ml-1.5">Reset</Text>
                    </TouchableOpacity>
                  )}
                  {userList.list.map((item) => (
                    <View key={item.key} className="py-2 border-b border-slate-100 dark:border-darkBorder">
                      <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{item.title}</Text>
                      <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">{item.subtitle}</Text>
                    </View>
                  ))}
                  {userList.hasMore && (
                    <TouchableOpacity
                      onPress={() => setUserLimit(prev => prev + 5)}
                      className="py-3 items-center"
                    >
                      <Text className="text-[11px] font-poppins-bold text-primary">Load More</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </DashboardActivityChart>
        </View>

        <View
          style={isWeb ? { maxWidth: WEB_CARD_MAX_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: WEB_CARD_PADDING } : {}}
          className={isWeb ? "mb-8" : "mb-8 px-6"}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary">Store Analytics</Text>
            <TouchableOpacity
              onPress={() => setShowStoreDetails(prev => !prev)}
              className="flex-row items-center bg-slate-50 dark:bg-darkBackgroundMuted px-3 py-1.5 rounded-full border border-slate-100 dark:border-darkBorder"
            >
              {showStoreDetails ? <EyeOff size={12} color="#475569" /> : <Eye size={12} color="#475569" />}
              <Text className="text-[10px] font-poppins-bold text-slate-600 dark:text-darkTextPrimary ml-1.5">
                {showStoreDetails ? "Hide Details" : "View Details"}
              </Text>
            </TouchableOpacity>
          </View>
          <DashboardActivityChart
            data={storeMetrics.series}
            labels={storeMetrics.labels}
            weekRange={storeMetrics.rangeLabel}
            loading={false}
            showDetails={showStoreDetails}
          >
            <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
              {storeList.list.length === 0 ? (
                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">No records for this period.</Text>
              ) : (
                <>
                  {storeLimit > 5 && (
                    <TouchableOpacity
                      onPress={() => setStoreLimit(5)}
                      className="py-2 flex-row items-center justify-end"
                    >
                      <RotateCcw size={12} color="#FF6600" />
                      <Text className="text-[11px] font-poppins-bold text-primary ml-1.5">Reset</Text>
                    </TouchableOpacity>
                  )}
                  {storeList.list.map((item) => (
                    <View key={item.key} className="py-2 border-b border-slate-100 dark:border-darkBorder">
                      <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{item.title}</Text>
                      <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">{item.subtitle}</Text>
                    </View>
                  ))}
                  {storeList.hasMore && (
                    <TouchableOpacity
                      onPress={() => setStoreLimit(prev => prev + 5)}
                      className="py-3 items-center"
                    >
                      <Text className="text-[11px] font-poppins-bold text-primary">Load More</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </DashboardActivityChart>

          <SubscriptionDistribution />
        </View>
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
        {/* Red message indicator badge */}
        <View className="absolute top-0 -right-1 w-[22px] h-[22px] bg-red-500 rounded-full border-2 border-white items-center justify-center">
          <Text className="text-[10px] font-poppins-bold text-white mt-0.5">
            1
          </Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
