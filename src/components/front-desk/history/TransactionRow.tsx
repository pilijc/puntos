import React, { memo } from "react";
import { View as NativeView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text } from "@/tw";
import { useColorScheme } from "react-native";
import { formatTxTime } from "@/utils/store_manager/transaction";

export type TxType = "earned" | "redeemed" | "pending";

export interface Transaction {
    id: string;
    timestamp: Date;
    points: number;
    amount: number;
    type: TxType;
    method?: "qr" | "manual";
    customerName?: string;
    rewardTitle?: string;
}

interface TransactionRowProps {
    tx: Transaction;
    isFirst: boolean;
    isLast: boolean;
}

const TYPE_CONFIG: Record<TxType, { icon: any; bg: string; bgDark: string; color: string; label: string }> = {
    earned: { icon: null, bg: "#FFF3E0", bgDark: "#431407", color: "#FF6600", label: "Earned" },
    redeemed: { icon: null, bg: "#F0FDF4", bgDark: "#052E16", color: "#22C55E", label: "Redeemed" },
    pending: { icon: null, bg: "#FFF7ED", bgDark: "#431407", color: "#F59E0B", label: "Pending" },
};

const TransactionRow = memo(function TransactionRow({ tx, isFirst, isLast }: TransactionRowProps) {
    const isDark = useColorScheme() === "dark";
    const borderColor = isDark ? "#262626" : "#F1F5F9";
    const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.earned;
    const amountColor = tx.type === "redeemed" ? "#EF4444" : tx.type === "pending" ? "#F59E0B" : "#FF6600";
    const amountPrefix = tx.type === "redeemed" ? "−" : "+";

    return (
        <View
            className={[
                "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground mx-4 border-l border-r border-b",
                isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
                isLast && "rounded-bl-[12px] rounded-br-[12px]",
            ].filter(Boolean).join(" ")}
            style={{ borderColor }}
        >
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? cfg.bgDark : cfg.bg }}
            >
                <MaterialIcons 
                    name={tx.method === "manual" ? "keyboard" : "qr-code-scanner"} 
                    size={20} 
                    color={cfg.color} 
                />
            </View>

            <View className="flex-1">
                <View className="flex-row items-start justify-between">
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1} style={{ flex: 1 }}>
                        {tx.customerName ?? "Customer"}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: amountColor }} numberOfLines={1}>
                        {amountPrefix}{tx.points} pts
                    </Text>
                </View>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-1.5">
                        {tx.type !== "redeemed" ? (
                            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                                ₱{tx.amount.toFixed(2)}
                            </Text>
                        ) : (
                            tx.rewardTitle && (
                                <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                                    {tx.rewardTitle}
                                </Text>
                            )
                        )}
                        {tx.type !== "earned" && (
                            <NativeView style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: isDark ? cfg.bgDark : cfg.bg }}>
                                <Text style={{ fontSize: 9, fontFamily: "Poppins-SemiBold", color: cfg.color }}>
                                    {cfg.label}
                                </Text>
                            </NativeView>
                        )}
                    </View>
                    <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted">
                        {formatTxTime(tx.timestamp.toISOString())}
                    </Text>
                </View>
            </View>
        </View>
    );
});

export default TransactionRow;
