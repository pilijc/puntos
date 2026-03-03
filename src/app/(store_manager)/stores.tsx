import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getMyStores, StoreRow } from "@/services/store-service";

const FILTERS = ["All", "active", "pending_review", "inactive"];

const FILTER_LABELS: Record<string, string> = {
    All: "All",
    active: "Active",
    pending_review: "Pending Review",
    inactive: "Inactive",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    active: { label: "Active", color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
    pending_review: { label: "Pending Review", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
    inactive: { label: "Inactive", color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

// ── Store Card ─────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreRow }) {
    const status = store.status ?? "inactive";
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["inactive"];

    return (
        <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={styles.storeImg}>
                    {store.logo ? (
                        <Image
                            source={{ uri: store.logo }}
                            style={{ width: 52, height: 52, borderRadius: 12 }}
                            contentFit="cover"
                            onLoad={() => console.log("[Image onLoad]", store.name)}
                            onError={(e) => console.log("[Image onError]", store.name, e)}
                        />
                    ) : (
                        <MaterialIcons name="storefront" size={22} color="#CBD5E1" />
                    )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    {store.address ? (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                            <MaterialIcons name="location-on" size={13} color="#94A3B8" />
                            <Text style={styles.storeLocation} numberOfLines={1}>{store.address}</Text>
                        </View>
                    ) : null}
                    {store.type ? (
                        <Text style={styles.storeType}>{store.type}</Text>
                    ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <MaterialIcons name="calendar-today" size={13} color="#94A3B8" />
                    <Text style={styles.statText}>
                        {new Date(store.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                </View>
                <TouchableOpacity style={styles.manageBtn}>
                    <Text style={styles.manageBtnText}>Manage</Text>
                    <MaterialIcons name="arrow-forward" size={13} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {status === "pending_review" && (
                <View style={styles.pendingBanner}>
                    <MaterialIcons name="hourglass-empty" size={14} color="#D97706" />
                    <Text style={styles.pendingText}>
                        Under review — our team will verify this store within 1–2 business days.
                    </Text>
                </View>
            )}
        </View>
    );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <View style={[styles.card, { gap: 12 }]}>
            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={[styles.storeImg, { backgroundColor: "#F1F5F9" }]} />
                <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ height: 14, borderRadius: 7, backgroundColor: "#F1F5F9", width: "60%" }} />
                    <View style={{ height: 11, borderRadius: 6, backgroundColor: "#F8FAFC", width: "80%" }} />
                </View>
            </View>
            <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />
            <View style={{ height: 11, borderRadius: 6, backgroundColor: "#F8FAFC", width: "40%" }} />
        </View>
    );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function StoreManagerStores() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStores = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const data = await getMyStores(user.id);
            console.log("[stores] fetched logos:", data.map(s => ({ id: s.id, name: s.name, logo: s.logo })));
            setStores(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load stores");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refetch every time the Stores tab comes into focus (covers post-create, post-edit, etc.)
    useFocusEffect(
        useCallback(() => {
            fetchStores();
            setRefreshing(false);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStores(true);
    };

    const filtered = activeFilter === "All"
        ? stores
        : stores.filter((s) => s.status === activeFilter);

    return (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Stores</Text>
                    <Text style={styles.headerSub}>
                        {loading ? "Loading..." : `${stores.length} store${stores.length !== 1 ? "s" : ""} managed`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, { alignSelf: "center" }]}
                    onPress={() => router.push("/(store_manager)/create-store")}
                >
                    <MaterialIcons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Add Store</Text>
                </TouchableOpacity>
            </View>

            {/* ── Filter pills ─────────────────────────────────────────────── */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {FILTERS.map((f) => {
                        const active = activeFilter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                style={[styles.filterPill, active && styles.filterPillActive]}
                            >
                                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                    {FILTER_LABELS[f]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Store list ─────────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF6600"
                        colors={["#FF6600"]}
                    />
                }
            >
                {/* Error state */}
                {error && !loading && (
                    <View style={styles.errorBanner}>
                        <MaterialIcons name="error-outline" size={16} color="#DC2626" />
                        <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                )}

                {/* Store cards */}
                {!loading && filtered.length > 0 &&
                    filtered.map((store) => <StoreCard key={store.id} store={store} />)
                }

                {/* Empty state */}
                {!loading && filtered.length === 0 && !error && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="storefront" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === "All" ? "No stores yet" : `No ${FILTER_LABELS[activeFilter]} stores`}
                        </Text>
                        <Text style={styles.emptySub}>
                            {activeFilter === "All"
                                ? "Tap \"Add Store\" to create your first store."
                                : "Try a different filter or add a new store."}
                        </Text>
                        {activeFilter === "All" && (
                            <TouchableOpacity
                                style={styles.emptyAddBtn}
                                onPress={() => router.push("/(store_manager)/create-store")}
                            >
                                <MaterialIcons name="add" size={16} color="#FF6600" />
                                <Text style={styles.emptyAddBtnText}>Add Store</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 70,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
    },
    headerSub: {
        fontSize: 12,
        fontFamily: "Poppins-Regular",
        color: "#94A3B8",
        marginTop: 2,
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FF6600",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    addBtnText: {
        fontSize: 13,
        fontFamily: "Poppins-Bold",
        color: "#FFFFFF",
    },
    filterWrapper: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    filterRow: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 9999,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    filterPillActive: {
        backgroundColor: "#FF6600",
        borderColor: "#FF6600",
    },
    filterText: {
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        color: "#64748B",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 4,
    },
    storeImgWrap: {
        position: "relative",
    },
    storeImg: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraBadge: {
        position: "absolute",
        bottom: -3,
        right: -3,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#FF6600",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
    },
    storeName: {
        fontSize: 15,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
    },
    storeLocation: {
        fontSize: 12,
        fontFamily: "Poppins-Regular",
        color: "#94A3B8",
        marginLeft: 2,
        flex: 1,
    },
    storeType: {
        fontSize: 11,
        fontFamily: "Poppins-Medium",
        color: "#FF6600",
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontFamily: "Poppins-Bold",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 12,
    },
    statText: {
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        color: "#475569",
    },
    manageBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9,
        backgroundColor: "#FFF5F0",
    },
    manageBtnText: {
        fontSize: 12,
        fontFamily: "Poppins-Bold",
        color: "#FF6600",
    },
    pendingBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        marginTop: 12,
        backgroundColor: "#FFFBEB",
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: "#F59E0B",
    },
    pendingText: {
        flex: 1,
        fontSize: 11,
        fontFamily: "Poppins-Regular",
        color: "#92400E",
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF2F2",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: "#DC2626",
    },
    errorBannerText: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Poppins-Regular",
        color: "#DC2626",
    },
    emptyState: {
        alignItems: "center",
        paddingTop: 60,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
    },
    emptySub: {
        fontSize: 13,
        fontFamily: "Poppins-Regular",
        color: "#94A3B8",
        textAlign: "center",
        paddingHorizontal: 32,
    },
    emptyAddBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#FF6600",
        backgroundColor: "#FFF5F0",
    },
    emptyAddBtnText: {
        fontSize: 13,
        fontFamily: "Poppins-Bold",
        color: "#FF6600",
    },
});
