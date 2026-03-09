import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { View, Text } from "@/tw";

const SOFT_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "Active", color: "#16A34A", dot: "#22C55E" },
  PENDING: { label: "Pending", color: "#DC2626", dot: "#EF4444" },
  INACTIVE: { label: "Inactive", color: "#DC2626", dot: "#EF4444" },
};

export const StoreCard = ({ store }: any) => {
  const status = store.status?.toUpperCase() ?? "INACTIVE";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["INACTIVE"];
  
  return (
    <View 
      style={[SOFT_CARD_SHADOW, { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" }]}
      className="mb-3"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row flex-1 items-center">
          <Image
            source={{ uri: store.logo || store.image || `https://api.dicebear.com/7.x/identicon/png?seed=${store.name || store.id}` }}
            style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#F1F5F9" }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-[14px] font-poppins-bold text-textPrimary">{store.name}</Text>
            {store.location && <Text className="text-[11px] font-poppins text-textMuted">{store.location}</Text>}
          </View>
        </View>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cfg.dot }} />
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity className="flex-1 py-2.5 rounded-xl items-center bg-[#F8FAFC] border border-[#E2E8F0]">
          <Text className="text-xs font-poppins-bold text-textSecondary">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-2.5 rounded-xl items-center bg-[#FFF5F5] border border-[#FEE2E2]">
          <Text className="text-xs font-poppins-bold text-[#DC2626]">Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};