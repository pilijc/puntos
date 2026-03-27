import React from "react";
import { View, Text } from "@/tw";

export const StatCard = ({ label, val, Icon }: { label: string, val: number | string, Icon: any }) => (
  <View 
    style={{ 
      backgroundColor: "#FFF", 
      borderRadius: 16, 
      paddingVertical: 14, 
      borderWidth: 1, 
      borderColor: "#F1F5F9" 
    }}
    className="flex-1 px-4 py-3"
  >
    <View className="flex-1 justify-between">
      <View className="flex-row items-center justify-center gap-x-2">
        <Icon size={16} color="#0F172A" />
        <Text className="text-[20px] font-poppins-bold text-primary">{val}</Text>
      </View>

      <View className="items-center">
        <Text className="text-[10px] font-poppins text-textMuted">{label}</Text>
      </View>
    </View>
  </View>
);