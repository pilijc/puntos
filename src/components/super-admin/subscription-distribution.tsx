import React from "react";
import { View, Text } from "@/tw";
import Svg, { Circle, Text as SvgText, G } from "react-native-svg";

export function SubscriptionDistribution() {
  const radius = 36;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  
  // Donut data
  const segments = [
    { percent: 0.80, color: "#FF6600", label: "Pro Plan", sub: "80%" },
    { percent: 0.20, color: "#E2E8F0", label: "Basic", sub: "20%" },
  ];

  // Leaders data
  const leaders = [
    { name: "Luxe Boutique", sales: "$4.2k", percent: 85 },
    { name: "Urban Gear", sales: "$3.1k", percent: 60 },
    { name: "Organic Foods", sales: "$1.8k", percent: 35 },
  ];

  let cumulativePercent = 0;

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
            <G rotation="-90" origin="50, 50">
              {segments.map((seg, i) => {
                const gap = 3;
                const segLength = Math.max(0, seg.percent * circumference - gap);
                const strokeDasharray = `${segLength} ${circumference}`;
                const strokeDashoffset = -(cumulativePercent * circumference);
                cumulativePercent += seg.percent;

                return (
                  <Circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </G>
            <SvgText
              x="50"
              y="55"
              textAnchor="middle"
              fill="#475569"
              fontSize="16"
              fontWeight="bold"
              fontFamily="Poppins-Bold"
            >
              75%
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
        Top Subscription Payers
      </Text>

      <View className="flex-col gap-4">
        {leaders.map((leader, i) => (
          <View key={i}>
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs font-poppins-bold text-[#1E293B] dark:text-darkTextPrimary">
                {leader.name}
              </Text>
              <Text className="text-xs font-poppins-bold text-[#1E293B] dark:text-darkTextPrimary">
                {leader.sales}
              </Text>
            </View>
            <View className="w-full h-1.5 bg-[#F1F5F9] dark:bg-darkBackgroundMuted rounded-full overflow-hidden">
              <View
                className="h-full bg-[#FF6600] rounded-full"
                style={{ width: `${leader.percent}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
