import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View as NativeView,
} from "react-native";
import { X, ArrowUpDown, Tag } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/tw";
import { Button } from "@/components/button";
import { useTranslation } from "react-i18next";

export type SortField = "date" | "amount";
export type SortDirection = "asc" | "desc";
export type TransactionType = "earned" | "redeemed" | "pending" | "all";

interface FilterSheetProps {
    visible: boolean;
    onClose: () => void;
    sortField: SortField;
    sortDirection: SortDirection;
    transactionType: TransactionType;
    setSortField: (field: SortField) => void;
    setSortDirection: (dir: SortDirection) => void;
    setTransactionType: (type: TransactionType) => void;
    activeFilterCount: number;
    resetFilters: () => void;
}

function ChipRow<T extends string>({ 
    options, 
    value, 
    onChange, 
    isDark 
}: { 
    options: { label: string; value: T }[]; 
    value: T; 
    onChange: (v: T) => void; 
    isDark: boolean 
}) {
    return (
        <NativeView style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={{
                            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1,
                            backgroundColor: active ? "#FF6600" : isDark ? "#262626" : "#F1F5F9",
                            borderColor: active ? "#FF6600" : isDark ? "#404040" : "#E2E8F0",
                        }}
                    >
                        <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: active ? "#FFFFFF" : isDark ? "#A3A3A3" : "#64748B" }}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </NativeView>
    );
}

export default function FilterSheet({
    visible,
    onClose,
    sortField,
    sortDirection,
    transactionType,
    setSortField,
    setSortDirection,
    setTransactionType,
    activeFilterCount,
    resetFilters,
}: FilterSheetProps) {
    const isDark = useColorScheme() === "dark";
    const insets = useSafeAreaInsets();
    const { t: translate } = useTranslation();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
                <Pressable onPress={() => { }} style={{ backgroundColor: isDark ? "#1C1C1C" : "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                    {/* Handle */}
                    <NativeView style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: isDark ? "#404040" : "#E2E8F0", alignSelf: "center", marginTop: 10, marginBottom: 16 }} />

                    {/* Header */}
                    <NativeView style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: isDark ? "#F5F5F5" : "#1E293B" }}>{translate("frontdesk.transaction.history.filters.title")}</Text>
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {activeFilterCount > 0 && (
                                <Button 
                                    label={translate("frontdesk.transaction.history.filters.clearAll", { count: activeFilterCount })} 
                                    onPress={resetFilters}
                                    variant="ghost"
                                />
                            )}
                            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? "#262626" : "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                                <X size={16} color={isDark ? "#A3A3A3" : "#64748B"} />
                            </TouchableOpacity>
                        </NativeView>
                    </NativeView>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Sort By */}
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                            <ArrowUpDown size={12} color={isDark ? "#737373" : "#94A3B8"} />
                            <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>{translate("frontdesk.transaction.history.filters.sortBy")}</Text>
                        </NativeView>
                        <ChipRow 
                            options={[
                                { label: translate("frontdesk.transaction.history.filters.date"), value: "date" }, 
                                { label: translate("frontdesk.transaction.history.filters.amount"), value: "amount" }
                            ] as { label: string; value: SortField }[]} 
                            value={sortField} 
                            onChange={setSortField} 
                            isDark={isDark} 
                        />

                        <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{translate("frontdesk.transaction.history.filters.direction")}</Text>
                        <ChipRow 
                            options={[
                                { label: translate("frontdesk.transaction.history.filters.newestHigh"), value: "desc" }, 
                                { label: translate("frontdesk.transaction.history.filters.oldestLow"), value: "asc" }
                            ] as { label: string; value: SortDirection }[]} 
                            value={sortDirection} 
                            onChange={setSortDirection} 
                            isDark={isDark} 
                        />

                        {/* Transaction Type */}
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6, marginTop: 4 }}>
                            <Tag size={12} color={isDark ? "#737373" : "#94A3B8"} />
                            <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>{translate("frontdesk.transaction.history.filters.type")}</Text>
                        </NativeView>
                        <ChipRow 
                            options={[
                                { label: translate("frontdesk.transaction.history.filters.all"), value: "all" }, 
                                { label: translate("frontdesk.transaction.history.filters.earned"), value: "earned" }, 
                                { label: translate("frontdesk.transaction.history.filters.redeemed"), value: "redeemed" }, 
                                { label: translate("frontdesk.transaction.history.filters.pending"), value: "pending" }
                            ] as { label: string; value: TransactionType }[]} 
                            value={transactionType} 
                            onChange={setTransactionType} 
                            isDark={isDark} 
                        />
                    </ScrollView>

                    <Button 
                        label={translate("frontdesk.transaction.history.filters.apply")} 
                        onPress={onClose}
                        variant="primary"
                        fullWidth
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
}
