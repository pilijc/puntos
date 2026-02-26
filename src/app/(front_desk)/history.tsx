import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const mockTransactions = [
    {
        id: "t1",
        name: "Sarah Jenkins",
        date: "Oct 24, 2023",
        time: "10:45 AM",
        amount: 500,
        points: 50,
    },
    {
        id: "t2",
        name: "Marcus Thorne",
        date: "Oct 24, 2023",
        time: "09:32 AM",
        amount: 1200,
        points: 120,
    },
    {
        id: "t3",
        name: "Alex Morgan",
        date: "Oct 24, 2023",
        time: "08:15 AM",
        amount: 300,
        points: 30,
    },
    {
        id: "t4",
        name: "Lena Park",
        date: "Oct 24, 2023",
        time: "11:20 AM",
        amount: 850,
        points: 85,
    },
    {
        id: "t5",
        name: "Carlos Rivera",
        date: "Oct 24, 2023",
        time: "12:05 PM",
        amount: 650,
        points: 65,
    },
    {
        id: "t6",
        name: "Priya Nair",
        date: "Oct 24, 2023",
        time: "01:30 PM",
        amount: 200,
        points: 20,
    },
    {
        id: "t7",
        name: "James Whitfield",
        date: "Oct 24, 2023",
        time: "02:48 PM",
        amount: 1500,
        points: 150,
    },
    {
        id: "t8",
        name: "Sophie Laurent",
        date: "Oct 24, 2023",
        time: "03:10 PM",
        amount: 400,
        points: 40,
    },
    {
        id: "t9",
        name: "David Kim",
        date: "Oct 24, 2023",
        time: "04:22 PM",
        amount: 950,
        points: 95,
    },
    {
        id: "t10",
        name: "Nina Castillo",
        date: "Oct 24, 2023",
        time: "05:05 PM",
        amount: 700,
        points: 70,
    },
];

const totalPtsToday = mockTransactions.reduce((sum, t) => sum + t.points, 0);

export default function FrontDeskHistory() {
    const softCardShadow = {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View
                    style={{
                        backgroundColor: "#FF6600",
                        borderBottomLeftRadius: 35,
                        borderBottomRightRadius: 35,
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: 25,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {/* Decorative Circles */}
                    <View style={{ position: "absolute", top: -40, right: -40, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(255,255,255,0.1)" }} />
                    <View style={{ position: "absolute", bottom: -48, left: -40, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)" }} />

                    {/* Top Bar */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, position: "relative" }}>
                        <Text style={{ color: "#FFFFFF", fontSize: 22, fontFamily: "Poppins-Bold" }}>Transaction History</Text>
                        <TouchableOpacity style={{ position: "absolute", right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "#FF6600", fontFamily: "Poppins-Bold", fontSize: 13 }}>?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Total Points Today Banner */}
                    <View
                        style={{
                            marginTop: 28,
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderRadius: 20,
                            paddingVertical: 20,
                            paddingHorizontal: 24,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Poppins-Bold", letterSpacing: 1.5 }}>
                            TOTAL POINTS ISSUED TODAY
                        </Text>
                        <Text style={{ color: "#FFFFFF", fontSize: 38, fontFamily: "Poppins-Bold", marginTop: 4 }}>
                            {totalPtsToday.toLocaleString()} PTS
                        </Text>

                        {/* View All Transactions Button */}
                        <TouchableOpacity
                            style={{
                                marginTop: 16,
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 9999,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.35)",
                            }}
                        >
                            <MaterialIcons name="history" size={16} color="#FFFFFF" />
                            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins-Bold", fontSize: 13, marginLeft: 6 }}>
                                View All Transactions
                            </Text>
                            <MaterialIcons name="chevron-right" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Transactions */}
                <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
                    {/* Transactions Card */}
                    <View
                        style={[
                            softCardShadow,
                            {
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                overflow: "hidden",
                            },
                        ]}
                    >
                        {mockTransactions.slice(0, 4).map((txn, index) => (
                            <View
                                key={txn.id}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    paddingVertical: 18,
                                    paddingHorizontal: 20,
                                    borderTopWidth: index === 0 ? 0 : 1,
                                    borderTopColor: "#F1F5F9",
                                }}
                            >
                                {/* Left: Avatar + Name & Time */}
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    <View
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            backgroundColor: "#FFF5F0",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 14,
                                        }}
                                    >
                                        <MaterialIcons name="person" size={22} color="#FF6600" />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
                                            {txn.name}
                                        </Text>
                                        <Text style={{ fontSize: 12, fontFamily: "Poppins-Regular", color: "#94A3B8", marginTop: 2 }}>
                                            {txn.date} • {txn.time}
                                        </Text>
                                    </View>
                                </View>

                                {/* Right: Amount + Points */}
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
                                        ₱{txn.amount.toLocaleString()}
                                    </Text>
                                    <Text style={{ fontSize: 13, fontFamily: "Poppins-Bold", color: "#FF6600", marginTop: 2 }}>
                                        +{txn.points} PTS
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* View More */}
                        <TouchableOpacity
                            style={{
                                paddingVertical: 16,
                                alignItems: "center",
                                borderTopWidth: 1,
                                borderTopColor: "#F1F5F9",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#FF6600" }}>View More</Text>
                                <MaterialIcons name="expand-more" size={18} color="#FF6600" style={{ marginLeft: 2 }} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
