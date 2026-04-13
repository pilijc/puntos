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

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
                <Pressable onPress={() => { }} style={{ backgroundColor: isDark ? "#1C1C1C" : "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                    {/* Handle */}
                    <NativeView style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: isDark ? "#404040" : "#E2E8F0", alignSelf: "center", marginTop: 10, marginBottom: 16 }} />

                    {/* Header */}
                    <NativeView style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: isDark ? "#F5F5F5" : "#1E293B" }}>Filter & Sort</Text>
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {activeFilterCount > 0 && (
                                <TouchableOpacity onPress={resetFilters}>
                                    <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#FF6600" }}>Clear all ({activeFilterCount})</Text>
                                </TouchableOpacity>
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
                            <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>Sort By</Text>
                        </NativeView>
                        <ChipRow 
                            options={[
                                { label: "Date", value: "date" }, 
                                { label: "Amount", value: "amount" }
                            ] as { label: string; value: SortField }[]} 
                            value={sortField} 
                            onChange={setSortField} 
                            isDark={isDark} 
                        />

                        <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Direction</Text>
                        <ChipRow 
                            options={[
                                { label: "Newest / High", value: "desc" }, 
                                { label: "Oldest / Low", value: "asc" }
                            ] as { label: string; value: SortDirection }[]} 
                            value={sortDirection} 
                            onChange={setSortDirection} 
                            isDark={isDark} 
                        />

                        {/* Transaction Type */}
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6, marginTop: 4 }}>
                            <Tag size={12} color={isDark ? "#737373" : "#94A3B8"} />
                            <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>Transaction Type</Text>
                        </NativeView>
                        <ChipRow 
                            options={[
                                { label: "All", value: "all" }, 
                                { label: "Earned", value: "earned" }, 
                                { label: "Redeemed", value: "redeemed" }, 
                                { label: "Pending", value: "pending" }
                            ] as { label: string; value: TransactionType }[]} 
                            value={transactionType} 
                            onChange={setTransactionType} 
                            isDark={isDark} 
                        />
                    </ScrollView>

                    <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#FF6600", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 0 }}>
                        <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#FFFFFF" }}>Apply Filters</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
