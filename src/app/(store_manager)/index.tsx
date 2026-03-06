import React, { useState, useCallback } from "react";
import { ActivityIndicator, RefreshControl, useColorScheme } from "react-native";
import { ScrollView, View, Text, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useFocusEffect } from "expo-router";
import { useStores, StoreStatusFilter } from "@/hooks/use-stores";
import { StoreRow } from "@/services/store-service";
import StoreDetailModal from "@/components/stores/StoreDetailModal";

// ── Engagement chart ───────────────────────────────────────────────────────
const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATA_Y = [0.85, 0.8, 0.75, 0.65, 0.35, 0.15, 0.25];

function buildCurvePath(width: number, height: number, values: number[]): string {
    const pts = values.map((v, i) => ({
        x: (i / (values.length - 1)) * width,
        y: v * height,
    }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
        const cp1y = pts[i - 1].y;
        const cp2x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
        const cp2y = pts[i].y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
}

const curvePath = buildCurvePath(CHART_WIDTH, CHART_HEIGHT, DATA_Y);
const areaPath = `${curvePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;
const lastPt = { x: CHART_WIDTH, y: DATA_Y[DATA_Y.length - 1] * CHART_HEIGHT };

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
    active: "#22C55E",
    pending_review: "#F59E0B",
    inactive: "#94A3B8",
};

const STATUS_LABEL: Record<string, string> = {
    active: "Active",
    pending_review: "Pending Review",
    inactive: "Inactive",
};

// ── Filter pills config ────────────────────────────────────────────────────
const FILTERS: { key: StoreStatusFilter; label: string }[] = [
    { key: "All", label: "All Stores" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "pending_review", label: "Pending" },
];

// ── Mini Store Card ────────────────────────────────────────────────────────
function MiniStoreCard({ store, onPress }: { store: StoreRow; onPress: (s: StoreRow) => void }) {
    const status = store.status ?? "inactive";
    const dotColor = STATUS_DOT[status] ?? STATUS_DOT["inactive"];
    const label = STATUS_LABEL[status] ?? "Inactive";

    return (
        <TouchableOpacity
            onPress={() => onPress(store)}
            activeOpacity={0.75}
            className="bg-white rounded-[20px] p-4 mb-3 shadow-sm dark:bg-darkBackgroundCard"
        >
            {/* Top row */}
            <View className="flex-row items-start">
                <View className="w-[52px] h-[52px] rounded-xl bg-slate-100 items-center justify-center mr-3">
                    <MaterialIcons name="storefront" size={22} color="#CBD5E1" />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{store.name}</Text>
                    {store.address ? (
                        <View className="flex-row items-center mt-0.5">
                            <MaterialIcons name="location-on" size={13} color="#94A3B8" />
                            <Text className="text-[13px] font-poppins text-textMuted ml-0.5 flex-1 dark:text-darkTextSecondary" numberOfLines={1}>
                                {store.address}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 my-3 dark:bg-slate-600" />

            {/* Bottom row */}
            <View className="flex-row">
                <View className="flex-1">
                    <Text className="text-[10px] font-poppins-bold text-textMuted tracking-widest mb-1.5">STATUS</Text>
                    <View className="flex-row items-center">
                        <View
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: dotColor }}
                        />
                        <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">{label}</Text>
                    </View>
                </View>
                <View className="w-px bg-slate-100 mx-4 dark:bg-slate-600" />
                <View className="flex-1">
                    <Text className="text-[10px] font-poppins-bold text-textMuted tracking-widest mb-1.5 dark:text-darkTextSecondary">TYPE</Text>
                    <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">{store.type ?? "—"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <View className="bg-white rounded-[20px] p-4 mb-3 gap-3">
            <View className="flex-row gap-3">
                <View className="w-[52px] h-[52px] rounded-xl bg-slate-100" />
                <View className="flex-1 gap-2">
                    <View className="h-3.5 rounded-lg bg-slate-100 w-3/5" />
                    <View className="h-3 rounded-md bg-slate-50 w-4/5" />
                </View>
            </View>
        </View>
    );
}

// ── Dashboard screen ───────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
    const isDark = useColorScheme() === "dark";
    const insets = useSafeAreaInsets();

    const { stores, filteredStores, loading, refreshing, error, activeFilter, setActiveFilter, refresh } = useStores();

    useFocusEffect(useCallback(() => { refresh(); }, []));

    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const openStore = (store: StoreRow) => {
        setSelectedStore(store);
        setModalVisible(true);
    };

    const handleStoreSaved = (updated: StoreRow) => {
        refresh();
        setSelectedStore(updated);
    };

    const firstStore = filteredStores[0] ?? stores[0];

    return (
        <View className="flex-1 bg-primary">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FFFFFF" colors={["#FF6600"]} />
                }
            >
                {/* ── Orange header ──────────────────────────────────────── */}
                <View
                    className="bg-primary px-6 pb-12 overflow-hidden"
                    style={{ paddingTop: insets.top + 12 }}
                >
                    {/* Decorative circles */}
                    <View className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
                    <View className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/[0.08]" />

                    <Text className="text-4xl font-poppins-bold text-white leading-10 mt-6">Dashboard</Text>
                    <Text className="text-sm font-poppins text-white/85 mt-1">
                        Overview of your store performance
                    </Text>
                </View>

                {/* ── White content area ─────────────────────────────────── */}
                <View className="flex-1 bg-backgroundMuted rounded-tl-[32px] rounded-tr-[32px] -mt-7 pt-7 px-5 pb-6 dark:bg-darkBackground">

                    {/* ── Store Performance Card ──────────────────────────── */}
                    <View className="bg-white rounded-3xl p-5 shadow-md overflow-hidden dark:bg-darkBackgroundMuted">
                        {/* Header row */}
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-1 mr-3">
                                <Text className="text-[11px] font-poppins-bold text-textMuted tracking-widest mb-1.5 dark:text-darkTextSecondary">
                                    STORE PERFORMANCE
                                </Text>
                                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                                    {firstStore ? firstStore.name : loading ? "Loading…" : "No Stores Yet"}
                                </Text>
                                {firstStore?.address ? (
                                    <View className="flex-row items-center mt-0.5">
                                        <MaterialIcons name="location-on" size={13} color="#94A3B8" className="dark:bg-orange-700" />
                                        <Text className="text-[13px] font-poppins text-textMuted ml-0.5 dark:text-darkTextSecondary" numberOfLines={1}>
                                            {firstStore.address}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <View className="w-11 h-11 rounded-xl bg-orange-50 items-center justify-center dark:bg-orange-700">
                                <MaterialIcons name="bar-chart" size={24} color="#FF6600" />
                            </View>
                        </View>

                        {/* Count row */}
                        <View className="flex-row items-center mb-1">
                            <Text className="text-4xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                                {stores.length > 0 ? `${stores.length}` : "—"}
                            </Text>
                            <View className="flex-row items-center ml-2.5 bg-green-50 rounded-lg px-2 py-1 dark:bg-green-700">
                                <MaterialIcons name="storefront" size={14} color="#22C55E" />
                                <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary ml-1">
                                    {stores.length === 1 ? "Store" : "Stores"}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-[10px] font-poppins-bold text-textMuted tracking-widest mb-5 dark:text-darkTextSecondary">
                            WEEKLY CUSTOMER ENGAGEMENT
                        </Text>

                        {/* SVG Chart */}
                        <View className="-mx-5">
                            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                                <Defs>
                                    <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0%" stopColor="#FF6600" stopOpacity="0.18" />
                                        <Stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
                                    </LinearGradient>
                                </Defs>
                                <Path d={areaPath} fill="url(#areaGrad)" />
                                <Path d={curvePath} fill="none" stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                <Circle cx={lastPt.x} cy={lastPt.y} r={6} fill="#FF6600" />
                                <Circle cx={lastPt.x} cy={lastPt.y} r={10} fill="rgba(255,102,0,0.2)" />
                            </Svg>
                            <View className="flex-row justify-between px-5 mt-2">
                                {DAYS.map((day) => (
                                    <Text key={day} className="text-[11px] font-poppins text-textMuted dark:text-darkTextSecondary">{day}</Text>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* ── My Stores section ──────────────────────────────── */}
                    <View className="mt-6">
                        {/* Section header */}
                        <View className="flex-row items-center justify-between mb-3.5 ">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-[9px] bg-orange-50 items-center justify-center mr-2 dark:bg-orange-700 dark:border-orange-50">
                                    <MaterialIcons name="storefront" size={18} color="#FF6600" />
                                </View>
                                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">My Stores</Text>
                            </View>
                            {loading && <ActivityIndicator size="small" color="#FF6600" />}
                        </View>

                        {/* Filter pills */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                        >
                            {FILTERS.map((f) => {
                                const isActive = activeFilter === f.key;
                                return (
                                    <TouchableOpacity
                                        key={f.key}
                                        onPress={() => setActiveFilter(f.key)}
                                        className={`px-[18px] py-2 rounded-full border-[1.5px]
                                            ${isActive
                                                ? "bg-primary border-primary"
                                                : "bg-white border-slate-200 dark:bg-darkBackgroundMuted dark:border-darkBorder"
                                            }`}
                                    >
                                        <Text className={`text-[13px] font-poppins-medium ${isActive ? "text-white" : "text-textSecondary dark:text-darkTextSecondary"}`}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Error banner */}
                        {error && !loading && (
                            <View className="flex-row items-center gap-2 bg-red-50 rounded-xl p-3 mb-3 border-l-[3px] border-danger">
                                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                                <Text className="flex-1 text-[13px] font-poppins text-danger">{error}</Text>
                            </View>
                        )}

                        {/* Skeleton */}
                        {loading && <><SkeletonCard /><SkeletonCard /></>}

                        {/* Store cards */}
                        {!loading && filteredStores.map((store) => (
                            <MiniStoreCard key={store.id} store={store} onPress={openStore} />
                        ))}

                        {/* Empty state */}
                        {!loading && filteredStores.length === 0 && !error && (
                            <View className="items-center py-8 gap-2">
                                <MaterialIcons name="storefront" size={40} color="#CBD5E1" />
                                <Text className="text-[15px] font-poppins-bold text-textPrimary">
                                    {activeFilter === "All" ? "No stores yet" : `No ${activeFilter} stores`}
                                </Text>
                                <Text className="text-[13px] font-poppins text-textMuted text-center">
                                    {activeFilter === "All" ? "Add your first store from the Stores tab." : "Try a different filter."}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Detail / Edit Modal */}
            <StoreDetailModal
                store={selectedStore}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSaved={handleStoreSaved}
                onDeleted={() => refresh()}
            />
        </View>
    );
}
