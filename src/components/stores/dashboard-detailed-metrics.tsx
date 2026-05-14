import React from "react";
import { TouchableOpacity } from "react-native";
import { View, Text } from "@/tw";
import { RecentTransaction } from "@/type/store-manager/metric";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { DashboardDetailedMetricsSkeleton } from "@/components/skeleton/store_manager/dashboard-detailed-metrics-skeleton";

interface Props {
    storeId: number;
    transactions: RecentTransaction[];
    loading?: boolean;
}

export function DashboardDetailedMetrics({ storeId, transactions = [], loading }: Props) {
    const router = useRouter();
    const { t: translate } = useTranslation();
    const displayTransactions = transactions.slice(0, 5);

    if (loading) {
        return <DashboardDetailedMetricsSkeleton />;
    }

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 elevation-1 border border-slate-100 dark:border-darkBorder mb-6">
            <View className="flex-row justify-between items-center mb-5">
                <Text className="text-[17px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-6">
                    {translate("storeManager.dashboard.detailedMetrics.title", "Recent Transactions")}
                </Text>

                <TouchableOpacity 
                    className="py-1 px-2"
                    onPress={() => router.push({
                        pathname: "/(store_manager)/transactions",
                        params: { storeId }
                    })}
                >
                    <Text className="text-[12px] font-poppins-bold text-[#ff6600]">
                        {translate("label.viewAll", "View All")}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="w-full">
                {/* Table Header */}
                <View className="flex-row pb-3 mb-1 border-b border-slate-100 dark:border-darkBorder/30">
                    <Text className="flex-1 text-[11px] font-poppins-semibold text-textSecondary dark:text-darkTextSecondary uppercase">{translate("label.dateAndTime", "Date")}</Text>
                    <Text className="flex-[2] text-[11px] font-poppins-semibold text-textSecondary dark:text-darkTextSecondary uppercase">{translate("label.user", "User")}</Text>
                </View>

                {/* Table Body */}
                {(!displayTransactions || displayTransactions.length === 0) ? (
                    <View className="p-8 items-center">
                        <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
                            {translate("storeManager.dashboard.detailedMetrics.noTransactions", "No recent transactions found.")}
                        </Text>
                    </View>
                ) : (
                    displayTransactions.map((tx, index) => {
                        const date = new Date(tx.created_at);
                        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                        return (
                            <View
                                key={tx.id || index.toString()} 
                                className={`flex-row py-4 items-center ${index !== displayTransactions.length - 1 ? 'border-b border-slate-50 dark:border-darkBorder/20' : ''}`}
                            >
                                <View className="flex-1">
                                    <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{dateStr}</Text>
                                    <Text className="text-[11px] font-poppins text-textSecondary dark:text-darkTextSecondary mt-0.5">{timeStr}</Text>
                                </View>
                                <View className="flex-[2] px-2">
                                    <Text className="text-[13px] font-poppins-semibold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                                        {tx.user?.name || translate("label.unknownUser", "Unknown User")}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </View>
    );
}
