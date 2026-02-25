import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function FrontDeskScan() {
    const router = useRouter();

    const softCardShadow = {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    };

    // Generate generic varied widths for a barcode simulation
    const barcodeLines = [4, 2, 6, 2, 2, 4, 8, 2, 4, 4, 2, 6, 2, 4, 6, 2, 4, 2, 6, 4];

    return (
        <SafeAreaView className="flex-1 bg-[#F1F5F9]">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Background & Header */}
                <View className="bg-primary rounded-b-[40px] px-6 pt-2 pb-24 overflow-hidden relative">
                    {/* Decorative Circles */}
                    <View className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10" />
                    <View className="absolute -bottom-16 -left-12 w-32 h-32 rounded-full bg-white/10" />

                    {/* Header Top Bar */}
                    <View className="flex-row items-center justify-between mt-2">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text className="text-white text-2xl font-poppins-bold">Award Points</Text>

                        <TouchableOpacity className="w-10 h-10 items-center justify-center">
                            <View className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <Text className="text-primary font-poppins-bold text-sm">?</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Location Box */}
                    <View className="mt-8 px-4 py-4 rounded-xl border border-white/20 bg-white/10 flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center">
                            <MaterialIcons name="storefront" size={24} color="#FFFFFF" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-[10px] tracking-[1px] font-poppins-bold text-white/70 uppercase">CURRENT LOCATION</Text>
                            <Text className="text-white text-sm font-poppins-bold mt-0.5">The Coffee Foundry • Brooklyn</Text>
                        </View>
                    </View>
                </View>

                {/* Scanner Card */}
                <View className="px-6 -mt-16 mb-12">
                    <View
                        style={[
                            softCardShadow,
                            { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 12 }
                        ]}
                    >
                        {/* The Black Scanner Viewport */}
                        <View
                            style={{
                                backgroundColor: "#111111",
                                borderRadius: 20,
                                width: "100%",
                                aspectRatio: 1, // Make it a square
                                padding: 24,
                                position: "relative",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Corner Markers */}
                            {/* Top Left */}
                            <View style={{ position: "absolute", top: 24, left: 24, width: 40, height: 40, borderColor: "#FFFFFF", borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 }} />
                            {/* Top Right */}
                            <View style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderColor: "#FFFFFF", borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 }} />
                            {/* Bottom Left */}
                            <View style={{ position: "absolute", bottom: 24, left: 24, width: 40, height: 40, borderColor: "#FFFFFF", borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 }} />
                            {/* Bottom Right */}
                            <View style={{ position: "absolute", bottom: 24, right: 24, width: 40, height: 40, borderColor: "#FFFFFF", borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 }} />

                            {/* Mock Barcode Graphic */}
                            <View style={{ flexDirection: "row", height: 80, alignItems: "center" }}>
                                {barcodeLines.map((width, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width,
                                            height: "100%",
                                            backgroundColor: "#9CA3AF",
                                            marginHorizontal: 1
                                        }}
                                    />
                                ))}
                            </View>

                            {/* Red Lasers Line Overlay */}
                            <View
                                style={{
                                    position: "absolute",
                                    width: "85%",
                                    height: 3,
                                    backgroundColor: "#EF4444",
                                    top: "50%",
                                    shadowColor: "#EF4444",
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 1,
                                    shadowRadius: 10,
                                    elevation: 10,
                                }}
                            />

                            {/* Instructions text */}
                            <Text
                                style={{
                                    position: "absolute",
                                    bottom: 40,
                                    color: "#FFFFFF",
                                    fontFamily: "Poppins-Medium",
                                    fontSize: 12,
                                    textAlign: "center",
                                    paddingHorizontal: 20
                                }}
                            >
                                {`Align customer QR code or Barcode within the\nframe`}
                            </Text>

                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
