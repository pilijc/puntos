import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

// ── Mock data ─────────────────────────────────────────────────────────────
const STORES = [
    { id: "1", name: "The Coffee Foundry", location: "Brooklyn, NY", status: "Active", staff: 12 },
    { id: "2", name: "Brew & Grind Co.", location: "Manhattan, NY", status: "Active", staff: 8 },
    { id: "3", name: "The Roast Room", location: "Queens, NY", status: "Inactive", staff: 5 },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Engagement chart (SVG curve approximating the mockup shape) ────────────
const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;

// Normalised data points for the smooth curve (0–1 range, y inverted for SVG)
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

function buildAreaPath(curvePath: string, width: number, height: number): string {
    return `${curvePath} L ${width} ${height} L 0 ${height} Z`;
}

const curvePath = buildCurvePath(CHART_WIDTH, CHART_HEIGHT, DATA_Y);
const areaPath = buildAreaPath(curvePath, CHART_WIDTH, CHART_HEIGHT);

const lastPt = {
    x: CHART_WIDTH,
    y: DATA_Y[DATA_Y.length - 1] * CHART_HEIGHT,
};

// ── Component ──────────────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, backgroundColor: "#FF6600" }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Orange Header ─────────────────────────────────────────── */}
                <View style={{ backgroundColor: "#FF6600", paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 48, overflow: "hidden" }}>
                    {/* Decorative circles */}
                    <View style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.12)" }} />
                    <View style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.08)" }} />

                    {/* Hero text */}
                    <Text style={{ fontSize: 36, fontFamily: "Poppins-Bold", color: "#FFFFFF", lineHeight: 42, marginTop: 24 }}>
                        Dashboard
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: "Poppins-Regular", color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                        Overview of your store performance
                    </Text>
                </View>

                {/* ── Content (pulls up over the orange header) ─────────────── */}
                <View style={{ flex: 1, backgroundColor: "#F3F4F6", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 24 }}>

                    {/* ── Store Performance Card ─────────────────────────────── */}
                    <View style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 24,
                        padding: 20,
                        shadowColor: "#0F172A",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.08,
                        shadowRadius: 16,
                        elevation: 6,
                        overflow: "hidden",
                    }}>
                        {/* Card header row */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <View>
                                <Text style={{ fontSize: 11, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1.2, marginBottom: 6 }}>
                                    STORE PERFORMANCE
                                </Text>
                                <Text style={{ fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
                                    {STORES[0].name}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                                    <MaterialIcons name="location-on" size={13} color="#94A3B8" />
                                    <Text style={{ fontSize: 13, fontFamily: "Poppins-Regular", color: "#94A3B8", marginLeft: 2 }}>
                                        {STORES[0].location}
                                    </Text>
                                </View>
                            </View>

                            {/* Chart icon badge */}
                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF5F0", alignItems: "center", justifyContent: "center" }}>
                                <MaterialIcons name="bar-chart" size={24} color="#FF6600" />
                            </View>
                        </View>

                        {/* Engagement metric */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <Text style={{ fontSize: 32, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
                                "2.4k"
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10, backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                                <MaterialIcons name="trending-up" size={14} color="#22C55E" />
                                <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#22C55E", marginLeft: 3 }}>
                                    "+12%"
                                </Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1.2, marginBottom: 20 }}>
                            WEEKLY CUSTOMER ENGAGEMENT
                        </Text>

                        {/* ── SVG Chart ──────────────────────────────────────── */}
                        <View style={{ marginHorizontal: -20 }}>
                            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                                <Defs>
                                    <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0%" stopColor="#FF6600" stopOpacity="0.18" />
                                        <Stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
                                    </LinearGradient>
                                </Defs>

                                {/* Area fill */}
                                <Path d={areaPath} fill="url(#areaGrad)" />

                                {/* Curve line */}
                                <Path
                                    d={curvePath}
                                    fill="none"
                                    stroke="#FF6600"
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* End dot */}
                                <Circle cx={lastPt.x} cy={lastPt.y} r={6} fill="#FF6600" />
                                <Circle cx={lastPt.x} cy={lastPt.y} r={10} fill="rgba(255,102,0,0.2)" />
                            </Svg>

                            {/* Day labels */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 }}>
                                {DAYS.map((day) => (
                                    <Text key={day} style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                                        {day}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* ── My Stores Section ──────────────────────────────────── */}
                    <View style={{ marginTop: 24 }}>
                        {/* Section header */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: "#FFF5F0", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                                    <MaterialIcons name="storefront" size={18} color="#FF6600" />
                                </View>
                                <Text style={{ fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A" }}>My Stores</Text>
                            </View>
                        </View>

                        {/* All Stores pill */}
                        <View style={{ flexDirection: "row", marginBottom: 16 }}>
                            <View style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9999, backgroundColor: "#FF6600" }}>
                                <Text style={{ fontSize: 13, fontFamily: "Poppins-Medium", color: "#FFFFFF" }}>All Stores</Text>
                            </View>
                        </View>

                        {/* Store cards */}
                        {STORES.map((store) => (
                            <View key={store.id} style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 20,
                                padding: 16,
                                marginBottom: 12,
                                shadowColor: "#0F172A",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.07,
                                shadowRadius: 12,
                                elevation: 4,
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                    <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                                        <MaterialIcons name="image" size={22} color="#CBD5E1" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A" }}>{store.name}</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                                            <MaterialIcons name="location-on" size={13} color="#94A3B8" />
                                            <Text style={{ fontSize: 13, fontFamily: "Poppins-Regular", color: "#94A3B8", marginLeft: 2 }}>{store.location}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={{ padding: 4 }}>
                                        <MaterialIcons name="more-vert" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 }} />
                                <View style={{ flexDirection: "row" }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1, marginBottom: 6 }}>STATUS</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: store.status === "Active" ? "#22C55E" : "#94A3B8", marginRight: 6 }} />
                                            <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" }}>{store.status}</Text>
                                        </View>
                                    </View>
                                    <View style={{ width: 1, backgroundColor: "#F1F5F9", marginHorizontal: 16 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1, marginBottom: 6 }}>STAFF COUNT</Text>
                                        <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" }}>{store.staff} Employees</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
