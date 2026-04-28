import React, { useMemo } from "react";
import { Platform } from "react-native";
import { View } from "@/tw";
import Svg, {
  Path, Defs, LinearGradient, Stop, G,
  Text as SvgText,
} from "react-native-svg";
import { AnimatedChartLines } from "./animated-chart-lines";

const isWeb = Platform.OS === "web";

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 300;
const CHART_PADDING_X = 60;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 50;

interface PlatformActivityChartProps {
  userSeries: number[];
  storeSeries: number[];
  labels: string[];
}

export function PlatformActivityChart({ userSeries, storeSeries, labels }: PlatformActivityChartProps) {
  const maxVal = Math.max(...userSeries, ...storeSeries, 5);

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

        <AnimatedChartLines
          userPoints={userPoints}
          storePoints={storePoints}
          userSeries={userSeries}
          storeSeries={storeSeries}
          chartBaseline={chartBaseline}
        />

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
  );
}
