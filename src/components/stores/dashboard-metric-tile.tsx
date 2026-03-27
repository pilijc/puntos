import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DashboardMetricTileProps } from "@/type/store-manager/metric";

export const DashboardMetricTile: React.FC<DashboardMetricTileProps> = ({
    label,
    value,
    subtitle,
    icon,
    loading,
}) => {
    const isDark = useColorScheme() === "dark";

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-3 flex-row items-center gap-[10px] flex-1 elevation-1 border border-transparent dark:border-darkBorder">
            <View className="w-10 h-10 rounded-full bg-[#f8fafc] dark:bg-darkBackgroundMuted items-center justify-center">
                <MaterialIcons
                    name={icon as any}
                    size={20}
                    color={isDark ? "#A3A3A3" : "#94A3B8"}
                />
            </View>

            <View className="flex-1">
                <Text className="text-[10px] font-poppins-bold text-textMuted dark:text-darkTextSecondary tracking-[0.4px] uppercase mb-[2px]">
                    {label}
                </Text>

                <View className="flex-row items-center flex-wrap gap-[4px]">
                    {loading ? (
                        <View key="loading-val" className="h-[28px] w-14 bg-background dark:bg-darkBackground rounded my-[2px] animate-pulse will-change-animation" />
                    ) : (
                        <Text key="content-val" className="text-[22px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {value}
                        </Text>
                    )}
                </View>

                {!!subtitle && (
                    <View className="flex-row items-center mt-[2px] gap-[4px]">
                        <View className="w-[5px] h-[5px] rounded-full bg-success" />
                        <Text className="text-[9px] font-poppins text-textMuted dark:text-darkTextMuted" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};