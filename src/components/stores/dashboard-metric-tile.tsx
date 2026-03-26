import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DashboardMetricTileProps } from "@/type/store-manager/metric";

export const DashboardMetricTile: React.FC<DashboardMetricTileProps> = ({
    label,
    value,
    subtitle,
    icon,
    loading,
    highlight,
}) => {
    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-[20px] p-3 flex-row items-center gap-[10px] flex-1 elevation-1">
            <View className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center">
                <MaterialIcons
                    name={icon as any}
                    size={22}
                    color={highlight ? "#FF6600" : "#BDBDBD"}
                />
            </View>

            <View className="flex-1">
                <Text className="text-[10px] font-poppins-bold text-[#94A3B8] tracking-[0.4px] uppercase mb-[2px]">
                    {label}
                </Text>

                <View className="flex-row items-center flex-wrap gap-[4px]">
                    <Text className="text-[24px] font-poppins-bold text-[#1E293B]">
                        {loading ? (
                            <View className="h-[28px] w-12 bg-background rounded my-[2px] animate-pulse" />
                        ) : (
                            <Text className="text-[24px] font-poppins-bold text-textSecondary">
                                {value}
                            </Text>
                        )}
                    </Text>
                </View>

                {!!subtitle && (
                    <View className="flex-row items-center mt-[2px] gap-[4px]">
                        <View className="w-[5px] h-[5px] rounded-full bg-[#22C55E]" />
                        <Text className="text-[9px] font-poppins text-[#94A3B8]" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};