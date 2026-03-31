import React from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { UserRow } from "./UserRow";
import { TYPO, COLORS } from "@/type/super-admin/user";

interface UserListItemProps {
  item: any;
  onPress: (user: any) => void;
}

export const UserListItem = React.memo(function UserListItem({
  item,
  onPress,
}: UserListItemProps) {
  if (item.isHeader) {
    return (
      <View className="bg-background flex-row items-center py-2 px-5 mt-2">
        <Text className={`${TYPO.sectionHeader} mr-2`}>{item.title}</Text>
        <View className="flex-1 h-[0.5px] bg-backgroundMuted" />
      </View>
    );
  }

  const isBlocked = item.status === "Blocked";
  const isSuperAdmin =
    item.roleLabel === "s-admin" || item.role_type === "super_admin";

  return (
    <TouchableOpacity
      disabled={isSuperAdmin}
      activeOpacity={isSuperAdmin ? 1 : 0.7}
      onPress={() => onPress(item)}
      className={`mx-4 ${isSuperAdmin ? "opacity-60" : ""}`}
    >
      <View
        className={`flex-row items-center bg-white rounded-xl mb-3 border ${
          isSuperAdmin
            ? "border-slate-200 bg-slate-50"
            : isBlocked
            ? "border-danger/20"
            : "border-slate-100"
        }`}
      >
        <View className="flex-1">
          <UserRow user={item} isFirst />
        </View>
        {!isSuperAdmin ? (
          <MaterialIcons
            name="chevron-right"
            size={18}
            color={COLORS.textMuted}
            style={{ marginRight: 12 }}
          />
        ) : (
          <Feather
            name="lock"
            size={14}
            color={COLORS.textMuted}
            style={{ marginRight: 15 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});
