import React, { useMemo } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { Text, View } from "@/tw";
import { Eye, EyeOff, Users, Store, RotateCcw } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { DetailList } from "@/services/super-admin/dashboard-analytics-service";
import Svg, {
  Path, Defs, LinearGradient, Stop, G,
  Text as SvgText,
} from "react-native-svg";
import { AnimatedChartLines } from "./animated-chart-lines";

const isWeb = Platform.OS === "web";

interface DashboardActivityLineChartProps {
  userSeries: number[];
  storeSeries: number[];
  labels: string[];
  weekRange: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  userList: DetailList;
  storeList: DetailList;
  onLoadMoreUsers: () => void;
  onLoadMoreStores: () => void;
  onResetUsers?: () => void;
  onResetStores?: () => void;
}

export function DashboardActivityLineChart({
  userSeries,
  storeSeries,
  labels,
  weekRange,
  showDetails,
  onToggleDetails,
  userList,
  storeList,
  onLoadMoreUsers,
  onLoadMoreStores,
  onResetUsers,
  onResetStores,
}: DashboardActivityLineChartProps) {
  const { t: translate } = useTranslation();
  const maxVal = Math.max(...userSeries, ...storeSeries, 5);
  const VIEWBOX_WIDTH = 800;
  const VIEWBOX_HEIGHT = 300;
  const CHART_PADDING_X = 60;
  const CHART_PADDING_TOP = 20;
  const CHART_PADDING_BOTTOM = 50;

  const chartWidth = VIEWBOX_WIDTH - CHART_PADDING_X * 2;
  const chartHeight = VIEWBOX_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const chartBaseline = VIEWBOX_HEIGHT - CHART_PADDING_BOTTOM;

  const getPoints = (series: number[]) =>
    series.map((val, i) => ({
      x: CHART_PADDING_X + (i / (series.length - 1)) * chartWidth,
      y: chartBaseline - (val / maxVal) * chartHeight,
    }));

  const userPoints = useMemo(() => getPoints(userSeries), [userSeries, maxVal]);
  const storePoints = useMemo(() => getPoints(storeSeries), [storeSeries, maxVal]);

  const yTicks = [0, 1, 2, 3, 4].map((i) => ({
    val: Math.round((maxVal / 4) * (4 - i)),
    y: CHART_PADDING_TOP + (i / 4) * chartHeight,
  }));

  return (
    <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl shadow-sm border border-slate-100 dark:border-darkBorder mb-6 overflow-hidden">

      {/* ── Header ── */}
      <View className="pt-6 pb-2 flex-row justify-between items-start" style={{ paddingHorizontal: "4%" }}>
        <View>
          <Text className="text-base font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
            {translate("superAdmin.dashboard.platformActivity")}
          </Text>
          <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-darkTextMuted mt-0.5">
            {weekRange}
          </Text>
        </View>
        <View style={{ flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
            <Text className="text-[8px] font-poppins-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {translate("superAdmin.dashboard.usersLegend")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
            <Text className="text-[8px] font-poppins-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {translate("superAdmin.dashboard.storesLegend")}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Chart Area ── */}
      <View style={{ height: isWeb ? 300 : 150, width: "100%" }}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="userAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FF6600" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#FF6600" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="storeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Y-axis labels + grid lines */}
          {yTicks.map(({ val, y }, i) => (
            <G key={i}>
              <SvgText
                x={CHART_PADDING_X - 15}
                y={y + 4}
                fill="#94A3B8"
                fontSize="10"
                textAnchor="end"
                fontFamily="Poppins-SemiBold"
              >
                {val}
              </SvgText>
              <Path
                d={`M ${CHART_PADDING_X} ${y} L ${VIEWBOX_WIDTH - CHART_PADDING_X} ${y}`}
                stroke="#F8FAFC"
                strokeWidth="1.5"
                strokeDasharray={i === 4 ? "0" : "5,5"}
              />
            </G>
          ))}

          {/* Animated lines + fill areas */}
          <AnimatedChartLines
            userPoints={userPoints}
            storePoints={storePoints}
            userSeries={userSeries}
            storeSeries={storeSeries}
            chartBaseline={chartBaseline}
          />

          {/* X-axis labels */}
          {labels.map((label, i) => {
            const up = userPoints[i];
            return (
              <G key={i}>
                <SvgText
                  x={up.x}
                  y={chartBaseline + 28}
                  fill="#64748B"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="Poppins-SemiBold"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* ── Toggle Button Area ── */}
      <View className="pt-4 pb-4 border-t border-slate-50 dark:border-darkBorder" style={{ paddingHorizontal: "4%" }}>
        <TouchableOpacity
          onPress={onToggleDetails}
          activeOpacity={0.8}
          className={`flex-col items-center justify-center py-4 rounded-3xl border shadow-sm ${showDetails
            ? "bg-slate-900 border-slate-800 dark:bg-darkBackgroundMuted dark:border-darkBorder"
            : "bg-white border-slate-200 dark:bg-darkBackgroundMuted dark:border-darkBorder"
            }`}
        >
          <View className="flex-row items-center -space-x-2.5">
            <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
              <Users size={12} color="#EA580C" strokeWidth={2.5} />
            </View>
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
              <Store size={12} color="#2563EB" strokeWidth={2.5} />
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm ${showDetails ? 'bg-slate-700' : 'bg-slate-100'}`}>
              {showDetails ? <EyeOff size={12} color="#fff" strokeWidth={2.5} /> : <Eye size={12} color="#64748B" strokeWidth={2.5} />}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Details Lists (Conditional) ── */}
      {showDetails && (
        <View className="pb-8 gap-8" style={{ paddingHorizontal: "4%" }}>

          {/* User Sign-ins Section */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-4 rounded-full bg-orange-500" />
                <Text className="text-[11px] font-poppins-bold text-slate-800 dark:text-darkTextPrimary uppercase tracking-widest">
                  {translate("superAdmin.dashboard.recentUserSignins")}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="bg-orange-50 px-2 py-0.5 rounded-md">
                  <Text className="text-[9px] font-poppins-bold text-orange-600">{userList.list.length} {translate("superAdmin.dashboard.records")}</Text>
                </View>
                {onResetUsers && userList.list.length > 5 && (
                  <TouchableOpacity onPress={onResetUsers} activeOpacity={0.6}>
                    <RotateCcw size={14} color="#EA580C" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View className="bg-slate-50/50 dark:bg-darkBackgroundMuted/30 rounded-2xl overflow-hidden border border-slate-100 dark:border-darkBorder">
              {userList.list.length === 0 ? (
                <View className="py-10 items-center">
                  <Users size={24} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-xs font-poppins text-slate-400 mt-2">{translate("superAdmin.dashboard.noNewUsers")}</Text>
                </View>
              ) : (
                <>
                  {userList.list.map((item, idx) => (
                    <View
                      key={item.key}
                      className={`flex-row items-center justify-between px-4 py-4 ${idx < userList.list.length - 1
                        ? "border-b border-white dark:border-darkBorder/40"
                        : ""
                        }`}
                    >
                      <View className="w-9 h-9 rounded-full bg-white dark:bg-darkBackgroundCard items-center justify-center mr-3 shadow-sm border border-orange-50">
                        <Text className="text-xs font-poppins-bold text-orange-500">
                          {item.title?.charAt(0)?.toUpperCase() ?? "?"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-poppins-bold text-slate-700 dark:text-darkTextPrimary">
                          {item.title}
                        </Text>
                        <Text className="text-[10px] font-poppins text-slate-400 dark:text-darkTextMuted">
                          {item.subtitle?.split(" • ")[1] ?? "Standard User"}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-darkTextSecondary bg-white dark:bg-darkBackground p-1 px-2 rounded-lg">
                          {item.subtitle?.split(" • ")[0]}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {userList.hasMore && (
                    <View className="py-4 items-center border-t border-slate-50 dark:border-darkBorder/30">
                      <TouchableOpacity
                        onPress={onLoadMoreUsers}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-2 bg-orange-50 dark:bg-orange-950/20 px-5 py-2.5 rounded-full border border-orange-100/50 dark:border-orange-900/10 shadow-sm shadow-orange-100/50"
                      >
                        <Text className="text-[11px] font-poppins-bold text-orange-600 uppercase tracking-tighter">
                          {translate("superAdmin.dashboard.showMore")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Registered Stores Section */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-4 rounded-full bg-blue-600" />
                <Text className="text-[11px] font-poppins-bold text-slate-800 dark:text-darkTextPrimary uppercase tracking-widest">
                  {translate("superAdmin.dashboard.recentlyRegisteredStores")}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="bg-blue-50 px-2 py-0.5 rounded-md">
                  <Text className="text-[9px] font-poppins-bold text-blue-600">{storeList.list.length} {translate("superAdmin.dashboard.records")}</Text>
                </View>
                {onResetStores && storeList.list.length > 5 && (
                  <TouchableOpacity onPress={onResetStores} activeOpacity={0.6}>
                    <RotateCcw size={14} color="#2563EB" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View className="bg-slate-50/50 dark:bg-darkBackgroundMuted/30 rounded-2xl overflow-hidden border border-slate-100 dark:border-darkBorder">
              {storeList.list.length === 0 ? (
                <View className="py-10 items-center">
                  <Store size={24} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-xs font-poppins text-slate-400 mt-2">{translate("superAdmin.dashboard.noNewStores")}</Text>
                </View>
              ) : (
                <>
                  {storeList.list.map((item, idx) => (
                    <View
                      key={item.key}
                      className={`flex-row items-center justify-between px-4 py-4 ${idx < storeList.list.length - 1
                        ? "border-b border-white dark:border-darkBorder/40"
                        : ""
                        }`}
                    >
                      <View className="w-9 h-9 rounded-full bg-white dark:bg-darkBackgroundCard items-center justify-center mr-3 shadow-sm border border-blue-50">
                        <Store size={14} color="#3B82F6" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-poppins-bold text-slate-700 dark:text-darkTextPrimary">
                          {item.title}
                        </Text>
                        <Text className="text-[10px] font-poppins text-slate-400 dark:text-darkTextMuted">
                          {item.subtitle?.split(" • ")[1] ?? "Active Store"}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-darkTextSecondary bg-white dark:bg-darkBackground p-1 px-2 rounded-lg">
                          {item.subtitle?.split(" • ")[0]}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {storeList.hasMore && (
                    <View className="py-4 items-center border-t border-slate-50 dark:border-darkBorder/30">
                      <TouchableOpacity
                        onPress={onLoadMoreStores}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-2 bg-blue-50 dark:bg-blue-950/20 px-5 py-2.5 rounded-full border border-blue-100/50 dark:border-blue-900/10 shadow-sm shadow-blue-100/50"
                      >
                        <Text className="text-[11px] font-poppins-bold text-blue-600 uppercase tracking-tighter">
                          {translate("superAdmin.dashboard.showMore")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
