import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import Svg, { Circle } from "react-native-svg";
import { RetentionData } from "@/type/store-manager/metric";

interface Props {
    data: RetentionData;
    loading?: boolean;
}

export function DashboardRetentionChart({ data, loading }: Props) {
    const isDark = useColorScheme() === "dark";
    const { returningPercent, newPercent } = data;

    const size = 130;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const dashOffset = circumference - (returningPercent / 100) * circumference;

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-5 elevation-1 mb-[14px] border border-transparent dark:border-darkBorder">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                Retention
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mt-0.5 mb-5">
                User loyalty overview
            </Text>

            {loading ? (
                <View key="loading-reten" className="items-center justify-center py-4">
                    <View className="w-[120px] h-[120px] rounded-full bg-backgroundMuted dark:bg-darkBackground animate-pulse will-change-animation" />
                </View>
            ) : (
                <React.Fragment key="content-reten">
                    <View className="items-center justify-center my-4">
                        <View style={{ width: size, height: size, position: "relative" }}>
                            <Svg width={size} height={size}>
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke={isDark ? "#262626" : "#e5e7eb"}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
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

                            <View className="absolute inset-0 items-center justify-center">
                                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                    {returningPercent}%
                                </Text>
                                <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted tracking-wide uppercase">
                                    Returning
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="gap-[8px]">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-primary" />
                                <Text className="text-[13px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                    Returning
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary dark:text-darkTextSecondary">
                                {returningPercent}%
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-[8px]">
                                <View className="w-[10px] h-[10px] rounded-full bg-slate-100 dark:bg-darkBackgroundMuted" />
                                <Text className="text-[13px] font-poppins text-textSecondary dark:text-darkTextSecondary">
                                    New
                                </Text>
                            </View>
                            <Text className="text-[13px] font-poppins-bold text-textSecondary dark:text-darkTextSecondary">
                                {newPercent}%
                            </Text>
                        </View>
                    </View>
                </React.Fragment>
            )}
        </View>
    );
}