import React from "react";
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function StoreManagerFeatures() {
    return (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
                <MaterialIcons name="apps" size={48} color="#FF6600" />
                <Text style={{ fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A" }}>Features</Text>
                <Text style={{ fontSize: 14, fontFamily: "Poppins-Regular", color: "#94A3B8", textAlign: "center", paddingHorizontal: 40 }}>
                    Store features and tools will appear here.
                </Text>
            </View>
        </View>
    );
}
