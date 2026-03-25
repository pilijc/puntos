import React from "react";
import { View, Text } from "@/tw";
import { StoreTransaction } from "@/type/store-manager/metric";

export function DashboardTransactionList({
    transactions,
    loading
}: {
    transactions: StoreTransaction[],
    loading?: boolean
}) {
    if (loading) {
        return (
            <View className="bg-background rounded-[20px] p-5 elevation-1">
                <Text className="text-lg font-poppins-bold text-textSecondary mb-4">
                    Recent Transactions
                </Text>
                {[1, 2, 3].map((i) => (
                    <View key={i} className="flex-row justify-between items-center py-3 border-b border-slate-100">
                        <View className="flex-1 gap-2">
                            <View className="h-4 w-32 bg-backgroundMuted rounded-full animate-pulse" />
                            <View className="h-3 w-48 bg-backgroundMuted rounded-full animate-pulse" />
                        </View>
                        <View className="h-6 w-12 bg-backgroundMuted rounded-full animate-pulse" />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View className="bg-background rounded-[20px] p-5 elevation-1">
            <Text className="text-lg font-poppins-bold text-textSecondary mb-4">
                Recent Transactions
            </Text>
            {transactions.length === 0 ? (
                <Text className="text-sm font-poppins text-textMuted py-4 text-center">
                    No recent transacations.
                </Text>
            ) : (
                transactions.map((tx, index) => (
                    <View
                        key={tx.id}
                        className={`flex-row justify-between items-center py-3 ${index !== transactions.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                        <View className="flex-1">
                            <Text className="text-sm font-poppins-bold text-textSecondary">
                                {tx.user_name}
                            </Text>
                            <Text className="text-xs font-poppins text-textMuted">
                                Staff: {tx.staff_name} • {new Date(tx.created_at).toLocaleDateString()}
                            </Text>
                        </View>

                        <View className="bg-orange-50 px-3 py-1 rounded-full">
                            <Text className="text-xs font-poppins-bold text-primary">
                                +{tx.points_earned} pts
                            </Text>
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}