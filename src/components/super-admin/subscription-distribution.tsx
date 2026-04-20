import React, { useMemo } from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import Svg, { Circle, Text as SvgText, G } from "react-native-svg";
import { useDashboardStore } from "@/store/dashboard-store";

export function SubscriptionDistribution() {
  const { stores, subscriptions, loading } = useDashboardStore();
  
  const radius = 36;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Calculate stats based on real data
  const stats = useMemo(() => {
    if (!stores.length) return null;

    // --- Fix #3: pre-index lookups into Maps to avoid O(owners × subscriptions) scans ---
    // Build a Map of owner_id → subscription row (O(subscriptions))
    const subByOwner = new Map(subscriptions.map(s => [s.owner_id, s]));

    // Build a Map of owner_id → store[] for the top-payers section (O(stores))
    const storesByOwner = new Map<string, typeof stores>();
    for (const store of stores) {
      if (!store.owner_id) continue;
      const existing = storesByOwner.get(store.owner_id);
      if (existing) {
        existing.push(store);
      } else {
        storesByOwner.set(store.owner_id, [store]);
      }
    }

    // Group stores by owner to get unique managers
    const ownerIds = Array.from(new Set(stores.map(s => s.owner_id).filter(Boolean)));
    const totalOwners = ownerIds.length || 1;

    let proCount = 0;
    let basicCount = 0;

    ownerIds.forEach(id => {
      const sub = subByOwner.get(id);  // O(1) lookup
      if (sub) {
        // Pro: paid or availed
        // Basic: pending or unpaid
        if (sub.payment_status === 'paid' || sub.payment_status === 'availed') {
          proCount++;
        } else {
          basicCount++;
        }
      } else {
        // Those not in subscription table are essentially "Free/Basic"
        basicCount++;
      }
    });

    const proPercent = proCount / totalOwners;
    const basicPercent = basicCount / totalOwners;

    // Get Top Payers (those with 'paid' status)
    const topPayers = subscriptions
      .filter(sub => sub.payment_status === 'paid')
      .slice(0, 3)
      .map(sub => {
        const ownerStores = storesByOwner.get(sub.owner_id) ?? [];  // O(1) lookup
        const name = ownerStores[0]?.owner_name || "Unknown Manager";
        // Calculate a pseudo-percent for the bar (using active stores count)
        const activeStores = ownerStores.filter(
          s => s.status === 'active' || s.is_active
        ).length;
        return {
          name,
          label: `${activeStores} Store${activeStores !== 1 ? 's' : ''}`,
          percent: Math.min(100, activeStores * 20), // Max 5 stores for 100% bar
          activeStores,
        };
      });

    return {
      proPercent,
      basicPercent,
      proDisplay: Math.round(proPercent * 100),
      basicDisplay: Math.round(basicPercent * 100),
      segments: [
        { percent: proPercent, color: "#FF6600", label: "Pro Plan", sub: `${Math.round(proPercent * 100)}%` },
        { percent: basicPercent, color: "#E2E8F0", label: "Basic", sub: `${Math.round(basicPercent * 100)}%` },
      ],
      leaders: topPayers,
    };
  }, [stores, subscriptions]);

  // Fix #2: split loading and empty-data into distinct guards.
  // The old `loading || !stats` caused a perpetual "Loading distribution..."
  // on empty deployments because !stats remained true after fetch completed.
  if (loading) {
    return (
      <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 mb-[8px] items-center justify-center h-48 border border-transparent dark:border-darkBorder">
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">Loading distribution...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 mb-[8px] items-center justify-center h-48 border border-transparent dark:border-darkBorder">
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">No subscription data yet.</Text>
      </View>
    );
  }

  const { segments, proDisplay, leaders } = stats;
  const isDark = useColorScheme() === "dark";

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
            {/* Background Circle (Basic) */}
            <Circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={isDark ? "#262626" : "#E2E8F0"}
              strokeWidth={strokeWidth}
            />
            {/* Pro Segment Overlay */}
            <G rotation="-90" origin="50, 50">
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
              {proDisplay}%
            </SvgText>
          </Svg>
        </View>

        {/* Legend */}
        <View className="flex-1 justify-center gap-3">
          {segments.map((seg, i) => (
            <View key={i} className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: seg.color }} />
              <Text className="text-xs font-poppins-bold text-[#475569] dark:text-darkTextPrimary">
                {seg.label} <Text className="font-poppins text-[#94A3B8] dark:text-darkTextMuted">({seg.sub})</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-slate-100 dark:bg-darkBorder mb-6" />

      {/* Leaders Section */}
      <Text className="text-[10px] font-poppins-bold text-[#475569] dark:text-darkTextPrimary mb-4 uppercase tracking-wider">
        Subscription Payers
      </Text>

      <View className="flex-col gap-4">
        {leaders.length === 0 ? (
          <Text className="text-[11px] font-poppins text-textMuted dark:text-darkTextMuted text-center py-4">
            No payers found yet.
          </Text>
        ) : (
          leaders.map((leader, i) => (
            <View key={i}>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-xs font-poppins-bold text-[#1E293B] dark:text-darkTextPrimary">
                  {leader.name}
                </Text>
                <Text className="text-[10px] font-poppins text-[#64748B] dark:text-darkTextMuted">
                  {leader.label}
                </Text>
              </View>
              <View className="w-full h-1.5 bg-[#F1F5F9] dark:bg-darkBackgroundMuted rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#FF6600] rounded-full"
                  style={{ width: `${leader.percent}%` }}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
