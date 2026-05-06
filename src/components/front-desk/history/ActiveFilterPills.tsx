import React from "react";
import { TouchableOpacity, View as NativeView } from "react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";

export type SortField = "date" | "amount";
export type SortDirection = "asc" | "desc";
export type TransactionType = "earned" | "redeemed" | "pending" | "all";

interface ActiveFilterPillsProps {
    sortField: SortField;
    sortDirection: SortDirection;
    transactionType: TransactionType;
    activeFilterCount: number;
    onResetFilters: () => void;
    isDark: boolean;
}

export default function ActiveFilterPills({
    sortField,
    sortDirection,
    transactionType,
    activeFilterCount,
    onResetFilters,
    isDark,
}: ActiveFilterPillsProps) {
    const { t: translate } = useTranslation();
    if (activeFilterCount === 0) return null;

    const pills: string[] = [];
    if (transactionType !== "all") {
        pills.push(translate(`frontdesk.transaction.history.filters.${transactionType}`));
    }
    
    if (sortField === "amount") {
        pills.push(translate("frontdesk.transaction.history.filters.amountPill", { direction: sortDirection === "desc" ? "↓" : "↑" }));
    } else if (sortDirection === "asc") {
        pills.push(translate("frontdesk.transaction.history.filters.oldestFirst"));
    }

    return (
        <View className="flex-row items-center flex-wrap gap-2 px-6 py-2" style={{ borderBottomWidth: 1, borderColor: isDark ? "#262626" : "#F1F5F9" }}>
            {pills.map((pill) => (
                <NativeView key={pill} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: isDark ? "#431407" : "#FFF3E0" }}>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#FF6600" }}>{pill}</Text>
                </NativeView>
            ))}
            <TouchableOpacity onPress={onResetFilters}>
                <Text style={{ fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#94A3B8" }}>{translate("frontdesk.transaction.history.filters.clearAll", { count: activeFilterCount })}</Text>
            </TouchableOpacity>
        </View>
    );
}
