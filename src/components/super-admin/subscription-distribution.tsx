import React, { useMemo } from "react";
import { Image, TouchableOpacity, useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import Svg, { Circle, Text as SvgText, G } from "react-native-svg";
import { Store, RotateCcw, User } from "lucide-react-native";
import { useDashboardStore } from "@/store/dashboard-store";
import {
  Timeframe,
  getItemDate,
  startOfDay,
  MONTH_NAMES,
} from "@/services/super-admin/dashboard-analytics-service";

interface SubscriptionDistributionProps {
  timeframe: Timeframe;
  payerLimit: number;
  onLoadMorePayers: () => void;
  onResetPayers?: () => void;
}

export function SubscriptionDistribution({
  timeframe,
  payerLimit,
  onLoadMorePayers,
  onResetPayers,
}: SubscriptionDistributionProps) {
  const { stores, subscriptions, users, loading } = useDashboardStore();
  const isDark = useColorScheme() === "dark";

  const radius = 36;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  const usersByOwner = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );

  const storesByOwner = useMemo(() => {
    const map = new Map<string, typeof stores>();
    for (const store of stores) {
      if (!store.owner_id) continue;
      const existing = map.get(store.owner_id);
      if (existing) existing.push(store);
      else map.set(store.owner_id, [store]);
    }
    return map;
  }, [stores]);

  const subByOwner = useMemo(
    () => new Map(subscriptions.map((s) => [s.owner_id, s])),
    [subscriptions]
  );

  const stats = useMemo(() => {
    if (!stores.length) return null;

    const ownerIds = Array.from(
      new Set(stores.map((s) => s.owner_id).filter(Boolean))
    );
    const totalOwners = ownerIds.length || 1;

    let proCount = 0;
    let basicCount = 0;

    ownerIds.forEach((id) => {
      const sub = subByOwner.get(id);
      if (sub) {
        if (sub.payment_status === "paid" || sub.payment_status === "availed") {
          proCount++;
        } else {
          basicCount++;
        }
      } else {
        basicCount++;
      }
    });

    const proPercent = proCount / totalOwners;
    const basicPercent = basicCount / totalOwners;

    return {
      proPercent,
      proDisplay: Math.round(proPercent * 100),
      segments: [
        {
          color: "#FF6600",
          label: "Pro Plan",
          sub: `${Math.round(proPercent * 100)}%`,
        },
        {
          color: "#E2E8F0",
          label: "Basic",
          sub: `${Math.round(basicPercent * 100)}%`,
        },
      ],
    };
  }, [stores, subByOwner]);

  const payersList = useMemo(() => {
    const nowDay = startOfDay(new Date()).getTime();
    const maxDiff = timeframe === "today" ? 0 : timeframe === "7d" ? 6 : 29;
    const dateKeys = ["updated_at", "current_period_start", "created_at"];

    const filtered = subscriptions
      .filter((sub) => sub.payment_status === "paid")
      .map((sub) => ({ sub, date: getItemDate(sub, dateKeys) }))
      .filter(({ date }) => {
        if (!date) return false;
        const diffDays = Math.floor(
          (nowDay - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= maxDiff;
      })
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

    const list = filtered.slice(0, payerLimit).map(({ sub, date }) => {
      const ownerStores = storesByOwner.get(sub.owner_id) ?? [];
      const name =
        ownerStores[0]?.owner_name ||
        (sub as any).owner_name ||
        "Unknown Manager";
      const activeStores = ownerStores.filter(
        (s) => s.status === "active" || s.is_active
      ).length;
      const dateLabel = date
        ? `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
        : "N/A";
      const avatar = usersByOwner.get(sub.owner_id)?.avatar ?? null;
      return { key: sub.owner_id, name, activeStores, dateLabel, avatar };
    });

    return { list, hasMore: filtered.length > payerLimit };
  }, [subscriptions, storesByOwner, timeframe, payerLimit]);

  if (loading) {
    return (
      <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 mb-[8px] items-center justify-center h-48 border border-transparent dark:border-darkBorder">
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
          Loading distribution...
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 mb-[8px] items-center justify-center h-48 border border-transparent dark:border-darkBorder">
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
          No subscription data yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 mb-[8px] border border-transparent dark:border-darkBorder">
      {/* Distribution Section */}
      <Text className="text-[13px] font-poppins-bold text-[#475569] dark:text-darkTextPrimary mb-4">
        Subscription Distribution
      </Text>

      <View className="flex-row items-center mb-8">
        {/* Donut Chart */}
        <View className="w-[110px] h-[110px] justify-center items-center mr-6">
          <Svg width="110" height="110" viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={isDark ? "#262626" : "#E2E8F0"}
              strokeWidth={strokeWidth}
            />
            <G transform="rotate(-90, 50, 50)">
              {stats.proPercent > 0 && (
                <Circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#FF6600"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${stats.proPercent * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              )}
            </G>
            <SvgText
              x="50"
              y="55"
              textAnchor="middle"
              fill={isDark ? "#CBD5E1" : "#475569"}
              fontSize="16"
              fontWeight="bold"
              fontFamily="Poppins-Bold"
            >
              {stats.proDisplay}%
            </SvgText>
          </Svg>
        </View>

        {/* Legend */}
        <View className="flex-1 justify-center gap-3">
          {stats.segments.map((seg, i) => (
            <View key={i} className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2.5"
                style={{ backgroundColor: seg.color }}
              />
              <Text className="text-xs font-poppins-bold text-[#475569] dark:text-darkTextPrimary">
                {seg.label}{" "}
                <Text className="font-poppins text-[#94A3B8] dark:text-darkTextMuted">
                  ({seg.sub})
                </Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-slate-100 dark:bg-darkBorder mb-5" />

      {/* Payers Section Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-4 rounded-full bg-orange-500" />
          <Text className="text-[11px] font-poppins-bold text-slate-800 dark:text-darkTextPrimary uppercase tracking-widest">
            Subscription Payers
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="bg-orange-50 px-2 py-0.5 rounded-md">
            <Text className="text-[9px] font-poppins-bold text-orange-600">
              {payersList.list.length} Records
            </Text>
          </View>
          {onResetPayers && payersList.list.length > 5 && (
            <TouchableOpacity onPress={onResetPayers} activeOpacity={0.6}>
              <RotateCcw size={14} color="#EA580C" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Payers List */}
      <View className="bg-slate-50/50 dark:bg-darkBackgroundMuted/30 rounded-2xl overflow-hidden border border-slate-100 dark:border-darkBorder">
        {payersList.list.length === 0 ? (
          <View className="py-10 items-center">
            <Store size={24} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-xs font-poppins text-slate-400 mt-2">
              No payers in this timeframe
            </Text>
          </View>
        ) : (
          <>
            {payersList.list.map((item, idx) => (
              <View
                key={item.key}
                className={`flex-row items-center px-4 py-4 ${
                  idx < payersList.list.length - 1
                    ? "border-b border-white dark:border-darkBorder/40"
                    : ""
                }`}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: isDark ? "#262626" : "#F1F5F9" }}
                  />
                ) : (
                  <View
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: "#FF660015" }}
                    className="items-center justify-center border border-primary/10"
                  >
                    <User size={18} color="#FF6600" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-poppins-bold text-slate-700 dark:text-darkTextPrimary">
                    {item.name}
                  </Text>
                  <Text className="text-[10px] font-poppins text-slate-400 dark:text-darkTextMuted">
                    {item.activeStores} Active Store{item.activeStores !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-darkTextSecondary bg-white dark:bg-darkBackground p-1 px-2 rounded-lg">
                    {item.dateLabel}
                  </Text>
                </View>
              </View>
            ))}

            {payersList.hasMore && (
              <View className="py-4 items-center border-t border-slate-50 dark:border-darkBorder/30">
                <TouchableOpacity
                  onPress={onLoadMorePayers}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-2 bg-orange-50 dark:bg-orange-950/20 px-5 py-2.5 rounded-full border border-orange-100/50 dark:border-orange-900/10 shadow-sm shadow-orange-100/50"
                >
                  <Text className="text-[11px] font-poppins-bold text-orange-600 uppercase tracking-tighter">
                    Show More
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
