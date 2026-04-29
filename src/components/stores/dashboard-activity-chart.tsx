import React, { useState } from "react";
import Svg, { Polyline, Circle, Path, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { getTodayIndex } from "@/utils/date-helpers";
import { ActivityMetricType, DashboardActivityChartProps } from "@/type/store-manager/metric";
import { DashboardActivityChartSkeleton } from "@/components/skeleton/store_manager/dashboard-activity-chart-skeleton";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

interface ExtendedDashboardActivityChartProps extends DashboardActivityChartProps {
    title?: string;
    showDetails?: boolean;
    onToggleDetails?: () => void;
    footerLabel?: string;
    children?: React.ReactNode;
}

import { Text, View, TouchableOpacity, Pressable } from "@/tw";
import { ChevronDown, ChevronUp, Check } from "lucide-react-native";

const isWeb = Platform.OS === "web";

const MOBILE_HEIGHT = 100;

const metricOptions: { value: ActivityMetricType, label: string }[] = [
    { value: 'scans', label: 'Total Scans' },
    { value: 'unique_visitors', label: 'Unique Visitors' },
    { value: 'redemptions', label: 'Redemptions' },
    { value: 'new_members', label: 'New Members' },
];

export const DashboardActivityChart: React.FC<ExtendedDashboardActivityChartProps> = ({
    data,
    labels,
    weekRange,
    loading,
    title,
    showDetails,
    onToggleDetails,
    children
}) => {
    const { t: translate } = useTranslation();
    const [containerWidth, setContainerWidth] = useState(0);
    const [selectedMetric, setSelectedMetric] = useState<ActivityMetricType>('scans');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const viewBoxWidth = Math.max(containerWidth, 300);

    // Dynamic label count based on width: 14 for desktop (>700), 10 for tablet (>450), 7 for mobile, 5 for tiny screens
    const visibleDays = isWeb 
        ? containerWidth > 700 ? 14 : containerWidth > 450 ? 10 : containerWidth > 350 ? 7 : 5
        : 7;

    const currentDataArray = data[selectedMetric] || [];
    const displayData = currentDataArray.slice(-visibleDays);
    const displayLabels = labels.slice(-visibleDays);
    const count = displayData.length;
    const todayIdx = getTodayIndex(count);
    const maxVal = Math.max(...displayData, 1);

    // Compute chart height: proportional on web (FIXED at 285 as requested), fixed on mobile
    const chartContainerHeight = isWeb ? 285 : MOBILE_HEIGHT;

    // LINE_HEIGHT drives how high data points can go; leave less space at bottom on web
    const LINE_HEIGHT = Math.round(chartContainerHeight * (isWeb ? 0.88 : 0.75));
    const TOTAL_HEIGHT = chartContainerHeight;

    const paddingX = visibleDays <= 5 ? 60 : 20; // Increase padding for fewer points to prevent 'stretching'
    const chartWidth = viewBoxWidth - (paddingX * 2);

    // coordinates
    const points = displayData.map((val, i) => {
        const x = paddingX + (i / (count - 1)) * chartWidth;
        const y = LINE_HEIGHT - Math.max((val / maxVal) * LINE_HEIGHT * 0.75, 4);
        return { x, y };
    });

    const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    // gradient
    const areaPath = `
        M ${points[0]?.x || 0},${LINE_HEIGHT} 
        ${points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} 
        L ${points[points.length - 1]?.x || 0},${LINE_HEIGHT} 
        Z
    `;

    if (loading) {
        return <DashboardActivityChartSkeleton />;
    }

    const totalStat = currentDataArray.reduce((sum, v) => sum + v, 0);
    const avgStat = count > 0 ? (totalStat / count).toFixed(1) : "0";
    const peakIdx = currentDataArray.indexOf(Math.max(...currentDataArray, 0));
    const peakLabel = labels?.[peakIdx] ?? "—";

    const activeOption = metricOptions.find(opt => opt.value === selectedMetric);

    return (
        <View
            className={`bg-white dark:bg-darkBackgroundCard rounded-xl p-4 elevation-1 border border-transparent dark:border-darkBorder${isWeb ? ' flex-1' : ' mb-[14px]'}`}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32)}
        >
            <View 
                className="flex-row justify-between items-start mb-4 relative z-50"
                style={{ zIndex: 100 }}
            >
                <View>
                    {title && (
                        <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                            {title}
                        </Text>
                    )}
                    <Text className="text-[12px] font-poppins text-textSecondary dark:text-darkTextSecondary mt-0.5">
                        {weekRange}
                    </Text>
                </View>
                
                <View className="relative z-50" style={{ zIndex: 110 }}>
                    <TouchableOpacity 
                        onPress={() => setDropdownOpen(!dropdownOpen)} 
                        activeOpacity={0.7}
                        className="flex-row items-center px-4 py-2.5 rounded-full bg-slate-50 dark:bg-darkBackgroundMuted border border-slate-200 dark:border-darkBorder"
                    >
                        <Text className="text-[12px] font-poppins-bold text-slate-700 dark:text-darkTextPrimary mr-2">
                            {translate(`store_manager.dashboard.activity.metric.${selectedMetric}`, activeOption?.label)}
                        </Text>
                        <View className="mt-0.5">
                            {dropdownOpen ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                        </View>
                    </TouchableOpacity>

                    {dropdownOpen && (
                        <View 
                            className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-darkBackgroundCard rounded-[28px] shadow-2xl border border-slate-100 dark:border-darkBorder p-2 z-50 elevation-10"
                            style={{ 
                                zIndex: 1000, 
                                shadowColor: '#000', 
                                shadowOffset: { width: 0, height: 12 }, 
                                shadowOpacity: 0.15, 
                                shadowRadius: 24 
                            }}
                        >
                            {metricOptions.map((opt, index) => {
                                const isActive = selectedMetric === opt.value;
                                return (
                                    <View key={opt.value}>
                                        <Pressable
                                            style={({ pressed }) => [
                                                { backgroundColor: pressed ? (isWeb ? '#f8fafc' : '#f1f5f9') : 'transparent' },
                                                isActive ? { backgroundColor: '#fff7ed' } : {}
                                            ]}
                                            className="px-4 py-3 rounded-[20px]"
                                            onPress={() => {
                                                setSelectedMetric(opt.value);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <View className="flex-row items-center justify-between w-full">
                                                <Text 
                                                    className={`text-[14px] font-poppins flex-1 mr-2 ${isActive ? 'text-[#FF6600] font-poppins-bold' : 'text-slate-600 dark:text-darkTextSecondary'}`}
                                                    numberOfLines={1}
                                                >
                                                    {translate(`store_manager.dashboard.activity.metric.${opt.value}`, opt.label)}
                                                </Text>
                                                {isActive && (
                                                    <View>
                                                        <Check size={18} color="#FF6600" strokeWidth={2.5} />
                                                    </View>
                                                )}
                                            </View>
                                        </Pressable>
                                        {(index < metricOptions.length - 1 && !isActive && selectedMetric !== metricOptions[index+1].value) && (
                                            <View className="mx-6 border-b border-slate-50 dark:border-darkBorder/30" />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
            <View style={{ height: TOTAL_HEIGHT }}>
                <Svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${viewBoxWidth} ${TOTAL_HEIGHT}`}
                    preserveAspectRatio="none"
                >
                    <Defs>
                        <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#FF6600" stopOpacity="0.18" />
                            <Stop offset="1" stopColor="#FF6600" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* shade */}
                    <Path d={areaPath} fill="url(#areaGradient)" />

                    {/* line */}
                    <Polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="#FF6600"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* dots and labels */}
                    {points.map((p, i) => {
                        const isToday = i === todayIdx;
                        const label = displayLabels[i];

                        return (
                            <React.Fragment key={i}>
                                <Circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isToday ? 5 : 3}
                                    fill={isToday ? "#FF6600" : "#fff"}
                                    stroke="#FF6600"
                                    strokeWidth="2"
                                />

                                <SvgText
                                    x={p.x}
                                    y={TOTAL_HEIGHT - 4}
                                    fill={isToday ? "#EA580C" : "#A3A3A3"}
                                    fontSize="10"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fontFamily="Poppins-Bold"
                                >
                                    {label}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </Svg>
            </View>

            {/* Web-only: summary stat pills with static equal-width positions */}
            {isWeb && (
                <View className="flex-row items-center mt-5 pt-5 border-t border-slate-100 dark:border-darkBorder">
                    {/* Always remains: Total Stat (Fixed 1/3 width) */}
                    <View className="flex-1 items-center">
                        <Text className="text-[11px] font-poppins text-textSecondary dark:text-darkTextSecondary uppercase tracking-[0.5px] text-center">
                            {translate("store_manager.dashboard.activity.totalStat", `Total ${activeOption?.label || 'Stat'}`)}
                        </Text>
                        <Text className="text-2xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-1">
                            {totalStat}
                        </Text>
                    </View>
                    
                    {/* Peak Day (Fixed 1/3 width) */}
                    {containerWidth > 350 && (
                        <>
                            <View className="w-px h-10 bg-slate-100 dark:bg-darkBorder" />
                            <View className="flex-1 items-center">
                                <Text className="text-[11px] font-poppins text-textSecondary dark:text-darkTextSecondary uppercase tracking-[0.5px] text-center">
                                    {translate("store_manager.dashboard.activity.peakDay", "Peak Day")}
                                </Text>
                                <Text className="text-2xl font-poppins-bold text-[#FF6600] mt-1">
                                    {peakLabel}
                                </Text>
                            </View>
                        </>
                    )}

                    {/* Daily Avg (Fixed 1/3 width) */}
                    {containerWidth > 600 && (
                        <>
                            <View className="w-px h-10 bg-slate-100 dark:bg-darkBorder" />
                            <View className="flex-1 items-center">
                                <Text className="text-[11px] font-poppins text-textSecondary dark:text-darkTextSecondary uppercase tracking-[0.5px] text-center">
                                    {translate("store_manager.dashboard.activity.dailyAvg", "Daily Avg")}
                                </Text>
                                <Text className="text-2xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-1">
                                    {avgStat}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* Dropdown Overlay for closing */}
            {dropdownOpen && (
                <Pressable 
                    className="absolute inset-0 z-40" 
                    onPress={() => setDropdownOpen(false)}
                />
            )}

            {(showDetails && children) && (
                <View className="mt-6 pt-4 border-t border-slate-100 dark:border-darkBorder">
                    {showDetails && children}
                </View>
            )}
        </View>
    );
};