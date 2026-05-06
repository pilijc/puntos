import React from "react";
import { TouchableOpacity } from "react-native";
import { ReceiptText } from "lucide-react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
    hasFilters: boolean;
    isDark: boolean;
    onResetFilters?: () => void;
}

export default function EmptyState({ hasFilters, isDark, onResetFilters }: EmptyStateProps) {
    const { t: translate } = useTranslation();
    return (
        <View className="flex-1 items-center justify-center gap-y-3 pt-20 px-10">
            <ReceiptText size={44} color={isDark ? "#404040" : "#E2E8F0"} strokeWidth={1.4} />
            <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary text-center">
                {hasFilters ? translate("frontdesk.transaction.history.emptyFound") : translate("frontdesk.transaction.history.emptyYet")}
            </Text>
            <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center">
                {hasFilters
                    ? translate("frontdesk.transaction.history.emptyFoundDetail")
                    : translate("frontdesk.transaction.history.emptyYetDetail")}
            </Text>
            {hasFilters && onResetFilters && (
                <TouchableOpacity
                    onPress={onResetFilters}
                    style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FF6600" }}
                >
                    <Text style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#FFFFFF" }}>{translate("frontdesk.transaction.history.clearFilters")}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
