import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function StoreManagerSettings() {
    const handleLogout = async () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace("/(onboarding)/welcome");
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 24 }}>
                <Text style={{ fontSize: 20, fontFamily: "Poppins-Bold", color: "#0F172A" }}>Settings</Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
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
