import React, { useMemo } from "react";
import { Platform } from "react-native";
import { View } from "@/tw";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { AnimatedChartLines } from "./animated-chart-lines";

const isWeb = Platform.OS === "web";

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 300;
const CHART_PADDING_X = 40;
const CHART_PADDING_TOP = 30;
const CHART_PADDING_BOTTOM = 50;

interface PlatformActivityChartProps {
  userSeries: number[];
  storeSeries: number[];
  labels: string[];
}

export function PlatformActivityChart({ userSeries, storeSeries, labels }: PlatformActivityChartProps) {
  const rawMax = Math.max(...userSeries, ...storeSeries, 1);
  const niceMax = Math.ceil(rawMax / 4) * 4;

  const chartWidth = VIEWBOX_WIDTH - CHART_PADDING_X * 2;
  const chartHeight = VIEWBOX_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const chartBaseline = VIEWBOX_HEIGHT - CHART_PADDING_BOTTOM;

  const getPoints = (series: number[]) =>
    series.map((val, i) => ({
      x: CHART_PADDING_X + (i / (series.length - 1)) * chartWidth,
      y: chartBaseline - (val / niceMax) * chartHeight,
    }));

  const userPoints = useMemo(() => getPoints(userSeries), [userSeries, niceMax]);
  const storePoints = useMemo(() => getPoints(storeSeries), [storeSeries, niceMax]);

  return (
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

        {/* Subtle horizontal reference lines — no numbers */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <Path
            key={i}
            d={`M ${CHART_PADDING_X} ${CHART_PADDING_TOP + frac * chartHeight} L ${VIEWBOX_WIDTH - CHART_PADDING_X} ${CHART_PADDING_TOP + frac * chartHeight}`}
            stroke="#F1F5F9"
            strokeWidth="1.5"
            strokeDasharray="4,6"
          />
        ))}

        <AnimatedChartLines
          userPoints={userPoints}
          storePoints={storePoints}
          userSeries={userSeries}
          storeSeries={storeSeries}
          chartBaseline={chartBaseline}
        />

        {/* Dot + value label above every non-zero user point */}
        {userSeries.map((val, i) => {
          if (val <= 0) return null;
          const pt = userPoints[i];
          return (
            <G key={`u-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r="3" fill="#FF6600" />
              <SvgText
                x={pt.x}
                y={pt.y - 14}
                fill="#FF6600"
                fontSize="8"
                fontFamily="Poppins-SemiBold"
                textAnchor="middle"
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* Dot + value label above every non-zero store point */}
        {storeSeries.map((val, i) => {
          if (val <= 0) return null;
          const pt = storePoints[i];
          const userAbove = userPoints[i]?.y < pt.y + 24;
          return (
            <G key={`s-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r="3" fill="#3B82F6" />
              <SvgText
                x={pt.x}
                y={userAbove ? pt.y + 26 : pt.y - 14}
                fill="#3B82F6"
                fontSize="8"
                fontFamily="Poppins-SemiBold"
                textAnchor="middle"
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* X-axis date labels */}
        {labels.map((label, i) => {
          const pt = userPoints[i];
          return (
            <G key={i}>
              <SvgText
                x={pt.x}
                y={chartBaseline + 28}
                fill="#64748B"
                fontSize="11"
                fontFamily="Poppins-SemiBold"
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
