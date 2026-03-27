import React from "react";
import { View } from "@/tw";
import Svg, { Polyline, Circle, Path, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { getTodayIndex } from "@/utils/date-helpers";
import { DashboardActivityChartProps } from "@/type/store-manager/metric";

const VIEWBOX_WIDTH = 300;
const LINE_HEIGHT = 80;
const TOTAL_HEIGHT = 110;

export const DashboardActivityChart: React.FC<DashboardActivityChartProps> = ({
    data,
    labels,
    loading,
}) => {
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
        return <View key="skeleton-activity" style={{ height: 110 }} className="w-full bg-backgroundMuted dark:bg-darkBackground rounded-[12px] animate-pulse will-change-animation" />;
    }

    return (
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
                                y={TOTAL_HEIGHT - 6}
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
    );
};