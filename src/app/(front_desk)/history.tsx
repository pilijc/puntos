import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator,
} from "react-native";
import { SlidersHorizontal } from "lucide-react-native";
import { View, Text } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStaffHistory } from "@/hooks/use-staff-history";
import { getDateSection } from "@/utils/store_manager/transaction";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { getCurrentStaffId } from "@/services/frontdesk/voucher-service";
import { getCurrentUserStore } from "@/services/frontdesk/scan-service";

// Import components
import TransactionRow, { Transaction } from "@/components/front-desk/history/TransactionRow";
import FilterSheet, { SortField, SortDirection, TransactionType } from "@/components/front-desk/history/FilterSheet";
import EmptyState from "@/components/front-desk/history/EmptyState";
import ActiveFilterPills from "@/components/front-desk/history/ActiveFilterPills";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
// SectionHeader
// ---------------------------------------------------------------------------

const SectionHeader = React.memo(function SectionHeader({ label }: { label: string }) {
    return (
        <View className="px-6 pt-3 pb-2 mt-2">
            <Text className="text-xs font-poppins-semibold text-textMuted dark:text-darkTextMuted">{label}</Text>
        </View>
    );
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function FrontDeskHistory() {
    const { staffTransactions, isLoading, isLoadingMore, hasMore, fetchStaffTransactions, loadMoreTransactions } = useStaffHistory();
    const isDark = useColorScheme() === "dark";
    const { t: translate } = useTranslation();
    const insets = useSafeAreaInsets();
    const [filterVisible, setFilterVisible] = useState(false);
    const [staffId, setStaffId] = useState<string>("");
    const [storeId, setStoreId] = useState<number | null>(null);

    // Filter state
    const { sortField, sortDirection, transactionType, activeFilterCount, resetFilters, setSortField, setSortDirection, setTransactionType } = useTransactionFilterStore();
    const filterCount = activeFilterCount();
    const hasFilters = filterCount > 0;

    // Load staff info and fetch transactions
    useEffect(() => {
        const loadStaffInfo = async () => {
            try {
                const currentStaffId = await getCurrentStaffId();
                
                if (!currentStaffId) return;
                
                const storeInfo = await getCurrentUserStore();
               
                if (!storeInfo) return;

                setStaffId(currentStaffId);
                setStoreId(storeInfo.id);
                fetchStaffTransactions(currentStaffId, storeInfo.id);
            } catch (error) {
                console.log("Error loading staff info:", error);
            }
        };

        loadStaffInfo();
    }, [fetchStaffTransactions]);

    // ── Filter + sort + section logic ─────────────────────────────────────────
    const listItems = useMemo<ListItem[]>(() => {
        let transactions: Transaction[] = (staffTransactions as any[]).map((s, i) => ({
            id: s.id ?? String(i),
            timestamp: s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp),
            points: s.points ?? 0,
            amount: s.amount ?? 0,
            type: (s.type as Transaction["type"]) ?? "earned",
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
    }, [staffTransactions, sortField, sortDirection, transactionType]);

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
            <ActiveFilterPills
                sortField={sortField}
                sortDirection={sortDirection}
                transactionType={transactionType}
                activeFilterCount={filterCount}
                onResetFilters={resetFilters}
                isDark={isDark}
            />

            {/* List / Empty / Loading */}
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator 
                        size="large" 
                        color={isDark ? "#FF6600" : "#FF6600"} 
                        style={{ marginBottom: 16 }}
                    />
                    <Text className="text-sm font-poppins text-textMuted dark:text-darkTextMuted">
                        Loading transactions...
                    </Text>
                </View>
            ) : listItems.length === 0 ? (
                <EmptyState 
                    hasFilters={hasFilters} 
                    isDark={isDark} 
                    onResetFilters={resetFilters}
                />
            ) : (
                <FlatList<ListItem>
                    data={listItems}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    onEndReached={() => {
                        if (staffId && storeId && hasMore && !isLoadingMore) {
                            loadMoreTransactions(staffId, storeId);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isLoadingMore ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={isDark ? "#FF6600" : "#FF6600"} />
                            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mt-2">
                                Loading more...
                            </Text>
                        </View>
                    ) : null}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    maxToRenderPerBatch={12}
                    windowSize={10}
                    initialNumToRender={15}
                />
            )}

            <FilterSheet
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                sortField={sortField}
                sortDirection={sortDirection}
                transactionType={transactionType}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
                setTransactionType={setTransactionType}
                activeFilterCount={filterCount}
                resetFilters={resetFilters}
            />
        </View>
    );
}
