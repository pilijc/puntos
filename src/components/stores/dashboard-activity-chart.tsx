import React from "react";
import { View, Text } from "@/tw";
import { getTodayIndex } from "@/utils/date-helpers";
import { DashboardActivityChartProps } from "@/type/store-manager/metric";

export const DashboardActivityChart: React.FC<DashboardActivityChartProps> = ({
    data,
    labels,
    loading
}) => {
    const todayIdx = getTodayIndex();
    const maxVal = Math.max(...data, 1);
    const BAR_HEIGHT = 90;

    return (
        <View className="flex-row justify-between items-end">
            {data.map((count, i) => {
                const isToday = i === todayIdx;
                const percentage = loading ? 40 : Math.max((count / maxVal) * 100, 5);

                return (
                    <View key={i} className="flex-1 items-center gap-[6px]">
                        {/* bar */}
                        <View style={{ height: BAR_HEIGHT }} className="w-full items-center justify-end">
                            <View
                                className={`w-[65%] rounded-[6px] ${loading ? 'bg-backgroundMuted animate-pulse' : ''}`}
                                style={{
                                    height: `${percentage}%`,
                                    backgroundColor: isToday ? "#FF6600" : "#E5E5E5",
                                }}
                            />
                        </View>

                        {loading ? (
                            <View className="h-2 w-full bg-backgroundMuted rounded-full mx-1" />
                        ) : (
                            <Text
                                className={`text-[9px] font-poppins-bold ${isToday ? 'text-[#FF6600]' : 'text-[#BDBDBD]'}`}
                            >
                                {labels[i]}
                            </Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
};