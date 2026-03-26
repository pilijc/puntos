import React from "react";
import { View, Text } from "@/tw";
import Svg, { Circle } from "react-native-svg";
import { RetentionData } from "@/type/store-manager/metric";

interface Props {
    data: RetentionData;
    loading?: boolean;
}

export function DashboardRetentionChart({ data, loading }: Props) {
    const { returningPercent, newPercent } = data;

    // Donut Math
    const size = 130;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate how much of the "orange" dashed line to show
    const dashOffset = circumference - (returningPercent / 100) * circumference;

    return (
        <View className="bg-white rounded-[20px] p-5 elevation-1 mb-[14px]">
            <Text className="text-lg font-poppins-bold text-textSecondary leading-6">
                Retention
            </Text>
            <Text className="text-xs font-poppins text-textMuted mt-0.5 mb-5">
                User loyalty overview
            </Text>

            {loading ? (
                <View className="items-center justify-center py-4">
                    <View className="w-[120px] h-[120px] rounded-full bg-backgroundMuted animate-pulse" />
                </View>
            ) : (
                <>
                    <View className="items-center justify-center my-4">
                        <View style={{ width: size, height: size, position: "relative" }}>
                            <Svg width={size} height={size}>
                                {/* Background Gray Ring */}
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="#e5e7eb"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
                                {/* Progress Orange Ring */}
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="#ff6600"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                />
                            </Svg>

                            {/* Center Labels */}
                            <View className="absolute inset-0 items-center justify-center">
                                <Text className="text-lg font-poppins-bold text-textSecondary">
                                    {returningPercent}%
                                </Text>
                                <Text className="text-[10px] font-poppins text-textMuted tracking-wide uppercase">
                                    Returning
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Legend */}
                    <View className="gap-[8px]">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-primary" />
                                <Text className="text-[13px] font-poppins text-textSecondary">
                                    Returning
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary">
                                {returningPercent}%
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-backgroundMuted" />
                                <Text className="text-[13px] font-poppins text-textSecondary">
                                    New
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary">
                                {newPercent}%
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}