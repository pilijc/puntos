import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_STORES = [
    { id: "1", name: "The Coffee Foundry", location: "Brooklyn, NY", status: "Active", staff: 12 },
    { id: "2", name: "Brew & Grind Co.", location: "Manhattan, NY", status: "Active", staff: 8 },
    { id: "3", name: "The Roast Room", location: "Queens, NY", status: "Pending Review", staff: 5 },
];

const FILTERS = ["All", "Active", "Pending Review", "Inactive"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
    "Active": { color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
    "Pending Review": { color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
    "Inactive": { color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

// ── Store Card ─────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: typeof MOCK_STORES[0] }) {
    const cfg = STATUS_CONFIG[store.status] ?? STATUS_CONFIG["Inactive"];
    return (
        <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={styles.storeImg}>
                    <MaterialIcons name="image" size={22} color="#CBD5E1" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                        <MaterialIcons name="location-on" size={13} color="#94A3B8" />
                        <Text style={styles.storeLocation}>{store.location}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{store.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <MaterialIcons name="people" size={15} color="#94A3B8" />
                    <Text style={styles.statText}>{store.staff} Staff</Text>
                </View>
                <TouchableOpacity style={styles.manageBtn}>
                    <Text style={styles.manageBtnText}>Manage</Text>
                    <MaterialIcons name="arrow-forward" size={13} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {store.status === "Pending Review" && (
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

// ── Screen ─────────────────────────────────────────────────────────────────
export default function StoreManagerStores() {
    const [activeFilter, setActiveFilter] = useState("All");

    const filtered = MOCK_STORES.filter(
        (s) => activeFilter === "All" || s.status === activeFilter
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Stores</Text>
                    <Text style={styles.headerSub}>
                        {MOCK_STORES.length} store{MOCK_STORES.length !== 1 ? "s" : ""} managed
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

            {/* ── Filter pills (fixed height — no background bleed) ────────── */}
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
                                    {f}
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
            >
                {filtered.length > 0 ? (
                    filtered.map((store) => <StoreCard key={store.id} store={store} />)
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="storefront" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No stores found</Text>
                        <Text style={styles.emptySub}>
                            Tap "Add Store" to create your first store.
                        </Text>
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
    // Filter pills — wrapped in a plain View so it never grows past its content
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
    storeImg: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
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
        fontSize: 13,
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
    },
});
