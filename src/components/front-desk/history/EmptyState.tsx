import React from "react";
import { TouchableOpacity } from "react-native";
import { ReceiptText } from "lucide-react-native";
import { View, Text } from "@/tw";

interface EmptyStateProps {
    hasFilters: boolean;
    isDark: boolean;
    onResetFilters?: () => void;
}

export default function EmptyState({ hasFilters, isDark, onResetFilters }: EmptyStateProps) {
    return (
        <View className="flex-1 items-center justify-center gap-y-3 pt-20 px-10">
            <ReceiptText size={44} color={isDark ? "#404040" : "#E2E8F0"} strokeWidth={1.4} />
            <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary text-center">
                {hasFilters ? "No transactions found" : "No transactions yet"}
            </Text>
            <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center">
                {hasFilters
                    ? "Try adjusting your filters or date range to see more results."
                    : "Your transactions will appear here once customers start earning points."}
            </Text>
            {hasFilters && onResetFilters && (
                <TouchableOpacity
                    onPress={onResetFilters}
                    style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FF6600" }}
                >
                    <Text style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#FFFFFF" }}>Clear Filters</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
