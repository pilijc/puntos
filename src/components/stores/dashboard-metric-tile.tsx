import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { DashboardMetricTileProps } from "@/type/store-manager/metric";
import { DashboardMetricTileSkeleton } from '@/components/skeleton/store_manager/dashboard-metric-tile-skeleton';

export const DashboardMetricTile: React.FC<Omit<DashboardMetricTileProps, 'subtitle'>> = ({
    label,
    value,
    icon,
    loading,
}) => {
    const isDark = useColorScheme() === "dark";
    const IconComponent = icon as React.ElementType;

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-2 flex-1 elevation-1 border border-transparent dark:border-darkBorder justify-center">
            <Text className="text-[11px] font-poppins-bold text-textMuted dark:text-darkTextSecondary tracking-[0.5px] uppercase mb-[2px]">
                {label}
            </Text>

            <View className="flex-row items-center gap-[8px] mt-1">
                <View style={{ marginTop: -2 }}>
                    <IconComponent
                        size={22}
                        color={isDark ? "#A3A3A3" : "#94A3B8"}
                    />
                </View>

                {loading ? (
                    <DashboardMetricTileSkeleton />
                ) : (
                    <Text key="content-val" className="text-[24px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight">
                        {value}
                    </Text>
                )}
            </View>
        </View>
    );
};