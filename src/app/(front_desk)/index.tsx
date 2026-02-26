import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const POINTS_RATE = 0.1;
const amountGrid = [[100, 200, 300], [400, 500, 600], [700, 800, 900]];
const barcodeLines = [4, 2, 6, 2, 2, 4, 8, 2, 4, 4, 2, 6, 2, 4, 6, 2, 4, 2, 6, 4];

const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
};

export default function FrontDeskScan() {
    const [activeView, setActiveView] = useState<"scan" | "enter_points">("scan");
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

    const pointsEarned = selectedAmount ? Math.round(selectedAmount * POINTS_RATE) : null;

    const BottomBar = () => (
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 24, paddingBottom: 16, gap: 12 }}>
            <TouchableOpacity
                onPress={() => setActiveView("scan")}
                style={{
                    flex: 1, height: 54, borderRadius: 14,
                    backgroundColor: activeView === "scan" ? "#FF6600" : "#FFFFFF",
                    borderWidth: activeView === "scan" ? 0 : 1.5,
                    borderColor: "#FF6600",
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                }}
            >
                <MaterialIcons name="qr-code-scanner" size={20} color={activeView === "scan" ? "#FFFFFF" : "#FF6600"} />
                <Text style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: activeView === "scan" ? "#FFFFFF" : "#FF6600", marginLeft: 8 }}>
                    Activate
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setActiveView("enter_points")}
                style={{
                    flex: 1, height: 54, borderRadius: 14,
                    backgroundColor: activeView === "enter_points" ? "#FF6600" : "#FFFFFF",
                    borderWidth: activeView === "enter_points" ? 0 : 1.5,
                    borderColor: "#FF6600",
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                }}
            >
                <MaterialIcons name="payments" size={20} color={activeView === "enter_points" ? "#FFFFFF" : "#FF6600"} />
                <Text style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: activeView === "enter_points" ? "#FFFFFF" : "#FF6600", marginLeft: 8 }}>
                    Enter Amount
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Orange Header */}
                <View
                    style={{
                        backgroundColor: "#FF6600",
                        borderBottomLeftRadius: 36,
                        borderBottomRightRadius: 36,
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: 18,
                        overflow: "hidden",
                    }}
                >
                    <View style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.1)" }} />
                    <View style={{ position: "absolute", bottom: -36, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.1)" }} />

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, position: "relative" }}>
                        <Text style={{ color: "#FFFFFF", fontSize: 20, fontFamily: "Poppins-Bold", flex: 1, textAlign: "center" }}>Award Points</Text>
                        <TouchableOpacity style={{ position: "absolute", right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "#FF6600", fontFamily: "Poppins-Bold", fontSize: 12 }}>?</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.12)", flexDirection: "row", alignItems: "center" }}>
                        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                            <MaterialIcons name="storefront" size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: "Poppins-Bold", color: "rgba(255,255,255,0.7)" }}>CURRENT LOCATION</Text>
                            <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#FFFFFF", marginTop: 1 }}>The Coffee Foundry • Brooklyn</Text>
                        </View>
                    </View>
                </View>

                {/* ── Shared scrollable content area ── */}
                <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, justifyContent: "space-between" }}>

                    {/* ── SCAN VIEW ── */}
                    {activeView === "scan" && (
                        <View>
                            {/* Scanner Card */}
                            <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 10, marginBottom: 20 }]}>
                                <View
                                    style={{
                                        backgroundColor: "#111111",
                                        borderRadius: 18,
                                        width: "100%",
                                        height: 280,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {/* Corner Brackets */}
                                    <View style={{ position: "absolute", top: 20, left: 20, width: 36, height: 36, borderColor: "#FFFFFF", borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 }} />
                                    <View style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderColor: "#FFFFFF", borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 }} />
                                    <View style={{ position: "absolute", bottom: 20, left: 20, width: 36, height: 36, borderColor: "#FFFFFF", borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 }} />
                                    <View style={{ position: "absolute", bottom: 20, right: 20, width: 36, height: 36, borderColor: "#FFFFFF", borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 }} />

                                    {/* Barcode */}
                                    <View style={{ flexDirection: "row", height: 70, alignItems: "center" }}>
                                        {barcodeLines.map((width, index) => (
                                            <View key={index} style={{ width, height: "100%", backgroundColor: "#9CA3AF", marginHorizontal: 1 }} />
                                        ))}
                                    </View>

                                    {/* Laser */}
                                    <View style={{ position: "absolute", width: "80%", height: 2, backgroundColor: "#EF4444", top: "50%", shadowColor: "#EF4444", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 10 }} />

                                    {/* Hint */}
                                    <Text style={{ position: "absolute", bottom: 16, color: "rgba(255,255,255,0.75)", fontFamily: "Poppins-Medium", fontSize: 11, textAlign: "center" }}>
                                        Align customer QR code within the frame
                                    </Text>
                                </View>
                            </View>

                            {/* Point Details — compact single row strip */}
                            <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }]}>
                                {/* Label */}
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                    <MaterialIcons name="info-outline" size={15} color="#FF6600" />
                                    <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#0F172A", marginLeft: 5 }}>Points Detail</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: "#F1F5F9", marginBottom: 10 }} />
                                {selectedAmount && pointsEarned !== null ? (
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                                        {/* Purchase Amount */}
                                        <View style={{ alignItems: "center" }}>
                                            <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 0.8 }}>PURCHASE</Text>
                                            <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A", marginTop: 1 }}>₱{selectedAmount}</Text>
                                        </View>

                                        <MaterialIcons name="arrow-forward" size={16} color="#CBD5E1" />

                                        {/* Rate */}
                                        <View style={{ alignItems: "center" }}>
                                            <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 0.8 }}>RATE</Text>
                                            <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#64748B", marginTop: 1 }}>₱10 = 1 pt</Text>
                                        </View>

                                        <MaterialIcons name="arrow-forward" size={16} color="#CBD5E1" />

                                        {/* Points Earned */}
                                        <View style={{ alignItems: "center", backgroundColor: "#FFF5F0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                                            <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#FF6600", letterSpacing: 0.8 }}>EARN</Text>
                                            <Text style={{ fontSize: 16, fontFamily: "Poppins-Bold", color: "#FF6600", marginTop: 1 }}>+{pointsEarned} PTS</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <MaterialIcons name="touch-app" size={18} color="#CBD5E1" />
                                        <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginLeft: 8 }}>
                                            Tap "Enter Points" to select an amount.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* ── ENTER POINTS VIEW ── */}
                    {activeView === "enter_points" && (
                        <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24 }]}>
                            <Text style={{ fontSize: 11, fontFamily: "Poppins-Bold", color: "#94A3B8", letterSpacing: 1.5, textAlign: "center", marginBottom: 24 }}>
                                SELECT PURCHASE AMOUNT
                            </Text>

                            {amountGrid.map((row, rowIndex) => (
                                <View key={rowIndex} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: rowIndex < 2 ? 16 : 0 }}>
                                    {row.map((amount) => {
                                        const isSelected = selectedAmount === amount;
                                        return (
                                            <TouchableOpacity
                                                key={amount}
                                                onPress={() => setSelectedAmount(isSelected ? null : amount)}
                                                style={{
                                                    width: "30%",
                                                    aspectRatio: 1,
                                                    borderRadius: 9999,
                                                    backgroundColor: isSelected ? "#FF6600" : "#F1F5F9",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 22, fontFamily: "Poppins-Bold", color: isSelected ? "#FFFFFF" : "#0F172A" }}>
                                                    {amount}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ── Bottom Buttons — always at the bottom of scroll content ── */}
                    <BottomBar />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
