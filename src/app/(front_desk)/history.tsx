import React, { useCallback, useMemo, useState, memo } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    Modal,
    Pressable,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    View as NativeView,
    Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SlidersHorizontal, ReceiptText, QrCode, Gift, Clock, X, ArrowUpDown, Tag, Calendar } from "lucide-react-native";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { formatTxTime, getDateSection } from "@/utils/store_manager/transaction";
import { useTranslation } from "react-i18next";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";
type TransactionType = "earned" | "redeemed" | "pending" | "all";
type TxType = "earned" | "redeemed" | "pending";

interface Transaction {
    id: string;
    timestamp: Date;
    points: number;
    amount: number;
    type: TxType;
    method?: "qr" | "manual";
    customerName?: string;
}

type ListItem =
    | { kind: "header"; key: string; label: string }
    | { kind: "tx"; key: string; tx: Transaction };

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface TransactionFilterState {
    sortField: SortField;
    sortDirection: SortDirection;
    transactionType: TransactionType;
    setSortField: (field: SortField) => void;
    setSortDirection: (dir: SortDirection) => void;
    setTransactionType: (type: TransactionType) => void;
    resetFilters: () => void;
    activeFilterCount: () => number;
}

const DEFAULT_STATE = {
    sortField: "date" as SortField,
    sortDirection: "desc" as SortDirection,
    transactionType: "all" as TransactionType,
};

const useTransactionFilterStore = create<TransactionFilterState>()((set, get) => ({
    ...DEFAULT_STATE,
    setSortField: (sortField) => set({ sortField }),
    setSortDirection: (sortDirection) => set({ sortDirection }),
    setTransactionType: (transactionType) => set({ transactionType }),
    resetFilters: () => set({ ...DEFAULT_STATE }),
    activeFilterCount: () => {
        const { transactionType, sortField, sortDirection } = get();
        let count = 0;
        if (transactionType !== "all") count++;
        if (sortField !== "date" || sortDirection !== "desc") count++;
        return count;
    },
}));

// ---------------------------------------------------------------------------
// Type badge config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<TxType, { icon: any; bg: string; bgDark: string; color: string; label: string }> = {
    earned: { icon: QrCode, bg: "#FFF3E0", bgDark: "#431407", color: "#FF6600", label: "Earned" },
    redeemed: { icon: Gift, bg: "#F0FDF4", bgDark: "#052E16", color: "#22C55E", label: "Redeemed" },
    pending: { icon: Clock, bg: "#FFF7ED", bgDark: "#431407", color: "#F59E0B", label: "Pending" },
};

// ---------------------------------------------------------------------------
// AvatarInitials
// ---------------------------------------------------------------------------

function AvatarInitials({ name, size = 38 }: { name: string; size?: number }) {
    const isDark = useColorScheme() === "dark";
    const initials = name.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
    return (
        <View
            style={{ width: size, height: size, borderRadius: size / 2 }}
            className="bg-backgroundMuted dark:bg-darkBackgroundCard items-center justify-center"
        >
            <Text style={{ fontSize: size * 0.34 }} className="font-poppins-bold text-textMuted dark:text-darkTextSecondary">
                {initials}
            </Text>
        </View>
    );
}

// ---------------------------------------------------------------------------
// TransactionRow
// ---------------------------------------------------------------------------

const TransactionRow = memo(function TransactionRow({
    tx, isFirst, isLast,
}: {
    tx: Transaction; isFirst: boolean; isLast: boolean;
}) {
    const isDark = useColorScheme() === "dark";
    const borderColor = isDark ? "#262626" : "#F1F5F9";
    const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.earned;
    const Icon = cfg.icon;
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
                        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                            ₱{tx.amount.toFixed(2)}
                        </Text>
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

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

const SectionHeader = memo(function SectionHeader({ label }: { label: string }) {
    return (
        <View className="px-6 pt-3 pb-2 mt-2">
            <Text className="text-xs font-poppins-semibold text-textMuted dark:text-darkTextMuted">{label}</Text>
        </View>
    );
});

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

const EmptyState = memo(function EmptyState({ hasFilters, isDark }: { hasFilters: boolean; isDark: boolean }) {
    const { resetFilters } = useTransactionFilterStore();
    return (
        <View className="flex-1 items-center justify-center gap-y-3 pt-20 px-10">
            <ReceiptText size={44} color={isDark ? "#404040" : "#E2E8F0"} strokeWidth={1.4} />
            <Text className="text-base font-poppins-bold text-textSecondary dark:text-darkTextSecondary text-center">
                {hasFilters ? "No transactions found" : "No transactions yet"}
            </Text>
            <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted text-center">
                {hasFilters
                    ? "Try adjusting your filters or date range to see more results."
                    : "Transactions will appear here once customers start earning points."}
            </Text>
            {hasFilters && (
                <TouchableOpacity
                    onPress={resetFilters}
                    style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FF6600" }}
                >
                    <Text style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#FFFFFF" }}>Clear Filters</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

// ---------------------------------------------------------------------------
// ActiveFilterPills
// ---------------------------------------------------------------------------

const ActiveFilterPills = memo(function ActiveFilterPills({ isDark }: { isDark: boolean }) {
    const { sortField, sortDirection, transactionType, activeFilterCount, resetFilters } = useTransactionFilterStore();
    if (activeFilterCount() === 0) return null;

    const pills: string[] = [];
    if (transactionType !== "all") pills.push(transactionType.charAt(0).toUpperCase() + transactionType.slice(1));
    if (sortField === "amount") pills.push(`Amount ${sortDirection === "desc" ? "↓" : "↑"}`);
    else if (sortDirection === "asc") pills.push("Oldest first");

    return (
        <View className="flex-row items-center flex-wrap gap-2 px-6 py-2" style={{ borderBottomWidth: 1, borderColor: isDark ? "#262626" : "#F1F5F9" }}>
            {pills.map((pill) => (
                <NativeView key={pill} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: isDark ? "#431407" : "#FFF3E0" }}>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#FF6600" }}>{pill}</Text>
                </NativeView>
            ))}
            <TouchableOpacity onPress={resetFilters}>
                <Text style={{ fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#94A3B8" }}>Clear all</Text>
            </TouchableOpacity>
        </View>
    );
});

// ---------------------------------------------------------------------------
// FilterSheet
// ---------------------------------------------------------------------------

function ChipRow<T extends string>({ options, value, onChange, isDark }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void; isDark: boolean }) {
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

function FilterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const isDark = useColorScheme() === "dark";
    const insets = useSafeAreaInsets();
    const { sortField, sortDirection, transactionType, setSortField, setSortDirection, setTransactionType, activeFilterCount, resetFilters } = useTransactionFilterStore();
    const count = activeFilterCount();

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
                            {count > 0 && (
                                <TouchableOpacity onPress={resetFilters}>
                                    <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#FF6600" }}>Clear all ({count})</Text>
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
                        <ChipRow options={[{ label: "Date", value: "date" }, { label: "Amount", value: "amount" }] as { label: string; value: SortField }[]} value={sortField} onChange={setSortField} isDark={isDark} />

                        <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Direction</Text>
                        <ChipRow options={[{ label: "Newest / High", value: "desc" }, { label: "Oldest / Low", value: "asc" }] as { label: string; value: SortDirection }[]} value={sortDirection} onChange={setSortDirection} isDark={isDark} />

                        {/* Transaction Type */}
                        <NativeView style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6, marginTop: 4 }}>
                            <Tag size={12} color={isDark ? "#737373" : "#94A3B8"} />
                            <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: isDark ? "#737373" : "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>Transaction Type</Text>
                        </NativeView>
                        <ChipRow options={[{ label: "All", value: "all" }, { label: "Earned", value: "earned" }, { label: "Redeemed", value: "redeemed" }, { label: "Pending", value: "pending" }] as { label: string; value: TransactionType }[]} value={transactionType} onChange={setTransactionType} isDark={isDark} />
                    </ScrollView>

                    <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#FF6600", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 0 }}>
                        <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#FFFFFF" }}>Apply Filters</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function FrontDeskHistory() {
    const { recentScans, isLoading } = useRecentTransactions();
    const isDark = useColorScheme() === "dark";
    const { t: translate } = useTranslation();
    const insets = useSafeAreaInsets();
    const [filterVisible, setFilterVisible] = useState(false);

    const { sortField, sortDirection, transactionType, activeFilterCount } = useTransactionFilterStore();
    const filterCount = activeFilterCount();
    const hasFilters = filterCount > 0;

    // ── Filter + sort + section logic ─────────────────────────────────────────
    const listItems = useMemo<ListItem[]>(() => {
        let transactions: Transaction[] = (recentScans as any[]).map((s, i) => ({
            id: s.id ?? String(i),
            timestamp: s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp),
            points: s.points ?? 0,
            amount: s.amount ?? 0,
            type: (s.type as TxType) ?? "earned",
            method: s.method ?? "qr",
            customerName: s.customerName ?? "Customer",
        }));

        if (transactionType !== "all") {
            transactions = transactions.filter((tx) => tx.type === transactionType);
        }

        transactions.sort((a, b) => {
            const diff = sortField === "date"
                ? a.timestamp.getTime() - b.timestamp.getTime()
                : a.amount - b.amount;
            return sortDirection === "asc" ? diff : -diff;
        });

        const result: ListItem[] = [];
        let lastSection = "";
        transactions.forEach((tx, index) => {
            const section = getDateSection(tx.timestamp.toISOString());
            if (section !== lastSection) {
                result.push({ kind: "header", key: `h-${section}-${index}`, label: section });
                lastSection = section;
            }
            result.push({ kind: "tx", key: tx.id, tx });
        });
        return result;
    }, [recentScans, sortField, sortDirection, transactionType]);

    const total = listItems.filter((i) => i.kind === "tx").length;

    const keyExtractor = useCallback((item: ListItem) => item.key, []);

    const renderItem = useCallback(({ item, index }: ListRenderItemInfo<ListItem>) => {
        if (item.kind === "header") return <SectionHeader label={item.label} />;
        const prev = listItems[index - 1];
        const next = listItems[index + 1];
        return (
            <TransactionRow
                tx={item.tx}
                isFirst={!prev || prev.kind === "header"}
                isLast={!next || next.kind === "header"}
            />
        );
    }, [listItems]);

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? "#171717" : "#F8FAFC", paddingTop: insets.top }}>
            {/* Header */}
            <View className="bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
                <View>
                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
                        {translate("layout.transactions")}
                    </Text>
                    {!isLoading && total > 0 && (
                        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted" style={{ marginTop: -4 }}>
                            {total} {total === 1 ? "record" : "records"}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => setFilterVisible(true)}
                    style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                        borderColor: hasFilters ? "#FF6600" : isDark ? "#404040" : "#E2E8F0",
                        backgroundColor: hasFilters ? (isDark ? "#431407" : "#FFF3E0") : isDark ? "#262626" : "#F8FAFC",
                    }}
                >
                    <SlidersHorizontal size={15} color={hasFilters ? "#FF6600" : isDark ? "#A3A3A3" : "#64748B"} />
                    <Text style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: hasFilters ? "#FF6600" : isDark ? "#A3A3A3" : "#64748B" }}>
                        Filter{filterCount > 0 ? ` (${filterCount})` : ""}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Active filter pills */}
            <ActiveFilterPills isDark={isDark} />

            {/* List / Empty */}
            {listItems.length === 0 && !isLoading ? (
                <EmptyState hasFilters={hasFilters} isDark={isDark} />
            ) : (
                <FlatList<ListItem>
                    data={listItems}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    maxToRenderPerBatch={12}
                    windowSize={10}
                    initialNumToRender={15}
                />
            )}

            <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
        </View>
    );
}