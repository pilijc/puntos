import React from "react";
import { useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { DashboardMetricTileProps } from "@/type/store-manager/metric";
import { DashboardMetricTileSkeleton } from '@/components/skeleton/store_manager/dashboard-metric-tile-skeleton';

interface Props extends DashboardMetricTileProps {
    compact?: boolean;
}

export const DashboardMetricTile: React.FC<Props> = ({
    label,
    value,
    icon,
    loading,
    compact,
}) => {
    const isDark = useColorScheme() === "dark";
    const IconComponent = icon as React.ElementType | undefined;

    return (
        <View className={`bg-white dark:bg-darkBackgroundCard rounded-xl px-4 py-3 flex-1 elevation-1 border border-transparent dark:border-darkBorder justify-center${compact ? ' py-2' : ''}`}>
            <Text 
                className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-poppins-bold text-textSecondary dark:text-darkTextSecondary tracking-[0.5px] uppercase mb-[2px]`}
                numberOfLines={1}
            >
                {label}
            </Text>

            <View className="flex-row items-center gap-[8px] mt-1">
                {IconComponent && (
                    <View style={{ marginTop: -2 }}>
                        <IconComponent
                            size={compact ? 18 : 22}
                            color={isDark ? "#A3A3A3" : "#94A3B8"}
                        />
                    </View>
                )}

                {loading ? (
                    <DashboardMetricTileSkeleton />
                ) : (
                    <Text key="content-val" className={`${compact ? 'text-[18px]' : 'text-[24px]'} font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight`}>
                        {value}
                    </Text>
                )}
            </View>
        </View>
    );
};