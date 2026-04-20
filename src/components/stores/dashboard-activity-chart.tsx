import React from "react";

import Svg, { Polyline, Circle, Path, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { getTodayIndex } from "@/utils/date-helpers";
import { DashboardActivityChartProps } from "@/type/store-manager/metric";
import { DashboardActivityChartSkeleton } from "@/components/skeleton/store_manager/dashboard-activity-chart-skeleton";

interface ExtendedDashboardActivityChartProps extends DashboardActivityChartProps {
    title?: string;
    showDetails?: boolean;
    onToggleDetails?: () => void;
    footerLabel?: string;
    children?: React.ReactNode;
}

import { useTranslation } from "react-i18next";
import { Text, View, TouchableOpacity } from "@/tw";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const VIEWBOX_WIDTH = 300;
const LINE_HEIGHT = 80;
const TOTAL_HEIGHT = 100;

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
    const todayIdx = getTodayIndex();
    const maxVal = Math.max(...data, 1);
    const count = data.length;

    const paddingX = 20;
    const chartWidth = VIEWBOX_WIDTH - (paddingX * 2);

    // coordinates
    const points = data.map((val, i) => {
        const x = paddingX + (i / (count - 1)) * chartWidth;
        const y = LINE_HEIGHT - Math.max((val / maxVal) * LINE_HEIGHT * 0.75, 4);
        return { x, y };
    });

    const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    // gradient
    const areaPath = `
        M ${points[0].x},${LINE_HEIGHT} 
        ${points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} 
        L ${points[points.length - 1].x},${LINE_HEIGHT} 
        Z
    `;

    if (loading) {
        return <DashboardActivityChartSkeleton />;
    }

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <View className="flex-row justify-between items-start mb-5">
                <View>
                    {title && (
                        <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                            {title}
                        </Text>
                    )}
                    <Text className="text-[12px] font-poppins text-textMuted dark:text-darkTextMuted mt-0.5">
                        {weekRange}
                    </Text>
                </View>
                {onToggleDetails && (
                    <TouchableOpacity 
                        onPress={onToggleDetails} 
                        className="flex-row items-center px-4 py-1.5 rounded-full bg-slate-50 dark:bg-darkBackgroundMuted border border-slate-200 dark:border-darkBorder"
                    >
                        <Text className="text-[11px] font-poppins-bold text-slate-600 dark:text-darkTextPrimary mr-1.5">
                            {showDetails ? translate("label.hideDetails") || "Hide Details" : translate("label.viewDetails") || "View Details"}
                        </Text>
                        {showDetails ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
                    </TouchableOpacity>
                )}
            </View>
            <View style={{ height: TOTAL_HEIGHT }}>
                <Svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${TOTAL_HEIGHT}`}
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
                        const label = labels[i];

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

            {(showDetails && children) && (
                <View className="mt-6 pt-4 border-t border-slate-100 dark:border-darkBorder">
                    {showDetails && children}
                </View>
            )}
        </View>
    );
};