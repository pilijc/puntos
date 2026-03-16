import React from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SectionHeaderProps {
  title: string;
  onAction: () => void;
}

export const SectionHeader = ({ title, onAction }: SectionHeaderProps) => (
  <View className="flex-row justify-between items-center mb-3">
    <Text className="text-base font-poppins-bold text-textPrimary">{title}</Text>
    <TouchableOpacity className="flex-row items-center" onPress={onAction}>
      <Text className="text-[11px] font-poppins-bold text-primary mr-0.5">VIEW ALL</Text>
      <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
    </TouchableOpacity>
  </View>
);