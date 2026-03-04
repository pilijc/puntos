import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
                    // auth-listener handles redirect to /(onboarding)/welcome on SIGNED_OUT
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <MaterialIcons name="logout" size={20} color="#FF6600" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    title: {
        fontSize: 20,
        fontFamily: "Poppins-Bold",
        color: "#0F172A",
        marginBottom: 24,
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#FFF5F0",
        borderRadius: 14,
        paddingVertical: 14,
    },
    logoutText: {
        fontSize: 15,
        fontFamily: "Poppins-Bold",
        color: "#FF6600",
    },
});
