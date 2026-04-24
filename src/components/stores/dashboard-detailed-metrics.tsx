import React from "react";
import { TouchableOpacity } from "react-native";
import { View, Text } from "@/tw";
import { RecentTransaction } from "@/type/store-manager/metric";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { DashboardDetailedMetricsSkeleton } from "@/components/skeleton/store_manager/dashboard-detailed-metrics-skeleton";

interface Props {
    transactions: RecentTransaction[];
    loading?: boolean;
}

export function DashboardDetailedMetrics({ transactions = [], loading }: Props) {
    const router = useRouter();
    const { t: translate } = useTranslation();
    const displayTransactions = transactions.slice(0, 5);

    if (loading) {
        return <DashboardDetailedMetricsSkeleton />;
    }

    return (
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-5 shadow-sm mt-4 border border-border dark:border-darkBorder mb-6 will-change-animation">
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-2">
                    <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                        {translate("store_manager.dashboard.detailedMetrics.title", "Recent Transactions")}
                    </Text>
                    <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted mt-1">
                        {translate("store_manager.dashboard.detailedMetrics.subtitle", "A quick overview of your most recent transactions and point operations.")}
                    </Text>
                </View>

                <TouchableOpacity 
                    className="flex-row items-center py-1.5 px-3 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 ml-2"
                    onPress={() => router.push("/(store_manager)/transactions")}
                >
                    <Text className="text-xs font-poppins-bold text-primary mr-1 mt-1">
                        {translate("label.viewAll", "View All")}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-darkBorder">
                {/* Table Header */}
                <View className="flex-row bg-slate-50 dark:bg-darkBackgroundMuted p-3 border-b border-slate-200 dark:border-darkBorder">
                    <Text className="flex-1 text-xs font-poppins-bold text-textSecondary dark:text-darkTextSecondary">{translate("label.dateAndTime", "Date & Time")}</Text>
                    <Text className="flex-[2] text-xs font-poppins-bold text-textSecondary dark:text-darkTextSecondary">{translate("label.user", "User")}</Text>
                    <Text className="flex-1 text-xs font-poppins-bold text-textSecondary dark:text-darkTextSecondary text-right">{translate("label.points", "Points")}</Text>
                </View>

                {/* Table Body */}
                {(!displayTransactions || displayTransactions.length === 0) ? (
                    <View className="p-5 items-center">
                        <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted">
                            {translate("store_manager.dashboard.detailedMetrics.noTransactions", "No recent transactions found.")}
                        </Text>
                    </View>
                ) : (
                    displayTransactions.map((tx, index) => {
                        const date = new Date(tx.created_at);
                        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                        return (
                            <View 
                                key={tx.id || index.toString()} 
                                className={`flex-row p-3 items-center ${index !== displayTransactions.length - 1 ? 'border-b border-slate-100 dark:border-darkBorder' : ''}`}
                            >
                                <View className="flex-1">
                                    <Text className="text-xs font-poppins text-textPrimary dark:text-darkTextPrimary">{dateStr}</Text>
                                    <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted">{timeStr}</Text>
                                </View>
                                <View className="flex-[2] px-2">
                                    <Text className="text-xs font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                                        {tx.user?.display_name || tx.user?.username || 'Unknown User'}
                                    </Text>
                                    <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted" numberOfLines={1}>
                                        {tx.user?.username ? `@${tx.user.username}` : ''}
                                    </Text>
                                </View>
                                <Text className="flex-1 text-sm font-poppins-bold text-[#ff6600] text-right">
                                    +{tx.points_earned}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>
        </View>
    );
}
