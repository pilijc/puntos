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
        <View className={`bg-white dark:bg-darkBackgroundCard rounded-xl px-4 ${compact ? 'py-2.5' : 'py-3'} flex-1 elevation-1 border border-slate-100 dark:border-darkBorder justify-center min-h-[86px]`}>
            <Text
                className={`${compact ? 'text-[11px]' : 'text-[12px]'} font-poppins-semibold text-textSecondary dark:text-darkTextSecondary leading-4`}
                numberOfLines={2}
            >
                {label}
            </Text>

            <View className="flex-row items-center gap-[8px] mt-2">
                {IconComponent && (
                    <View style={{ marginTop: -1 }}>
                        <IconComponent
                            size={compact ? 14 : 17}
                            color={isDark ? "#A3A3A3" : "#94A3B8"}
                        />
                    </View>
                )}

                {loading ? (
                    <DashboardMetricTileSkeleton />
                ) : (
                    <Text key="content-val" className={`${compact ? 'text-[22px]' : 'text-[28px]'} font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight`}>
                        {value}
                    </Text>
                )}
            </View>
        </View>
    );
};
