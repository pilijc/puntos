import React from "react";
import { View, Text } from "@/tw"; // Ensure this is your tailwind import
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const SOFT_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
};

export const StatCard = ({ label, val, icon, color }: any) => (
  <View 
    style={[SOFT_CARD_SHADOW, { backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#F1F5F9" }]}
    className="flex-1 items-center" 
  >
    <MaterialIcons name={icon} size={16} color={color} />
    <Text className="text-[18px] font-poppins-bold text-textPrimary">{val}</Text>
    <Text className="text-[8px] font-poppins-bold text-textMuted uppercase">{label}</Text>
  </View>
);