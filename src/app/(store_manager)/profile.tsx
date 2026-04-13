import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function StoreManagerProfile() {
    const handleLogout = async () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.push(
                      Platform.OS === "web"
                        ? "/(onboarding)/welcome"
                        : "/(onboarding)/index",
                    );
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 24 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFF5F0", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="person" size={40} color="#FF6600" />
                </View>
                <Text style={{ fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
                    Store Manager
                </Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        width: "100%",
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: "#FFF5F0",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    <MaterialIcons name="logout" size={20} color="#FF6600" />
                    <Text style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: "#FF6600" }}>
                        Log Out
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
