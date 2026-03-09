import React from "react";
import { Image } from "react-native";
import { View, Text } from "@/tw"; // Use your TW wrapper

const getRoleDetails = (roleType: string, roleLevel?: number) => {
  const roles: Record<string, { label: string; bg: string; text: string }> = {
    super_admin: { label: "S-ADMIN", bg: "#FAF5FF", text: "#A855F7" },
    manager: { label: "MANAGER", bg: "#F0FDF4", text: "#16A34A" },
    front_desk: { label: "STAFF", bg: "#F0F9FF", text: "#0EA5E9" },
  };
  if (roles[roleType]) return roles[roleType];
  if (roleLevel === 0) return { label: "BLOCKED", bg: "#FEE2E2", text: "#EF4444" };
  return { label: "USER", bg: "#F1F5F9", text: "#94A3B8" };
};

export const UserRow = ({ user, isFirst }: any) => {
  const roleInfo = getRoleDetails(user.role_type, user.role);
  return (
    <View 
      className="flex-row items-center p-3.5"
      style={{ borderTopWidth: isFirst ? 0 : 1, borderTopColor: "#F8FAFC" }}
    >
      <Image source={{ uri: user.avatar }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9" }} />
      <View className="ml-3 flex-1">
        <Text className="text-[13px] font-poppins-bold text-textPrimary">{user.name || "User"}</Text>
        <Text className="text-[10px] font-poppins text-textMuted italic">{user.displayEmail}</Text>
      </View>
      <View style={{ backgroundColor: roleInfo.bg }} className="px-[10px] py-1 rounded-md">
        <Text style={{ color: roleInfo.text }} className="text-[9px] font-poppins-bold">{roleInfo.label}</Text>
      </View>
    </View>
  );
};