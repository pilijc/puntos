import React from "react";
import { Image } from "react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";

const getRoleDetails = (roleType: string, roleLevel?: number, translate?: any) => {
  const orangeRole = { bg: "transparent", text: "#FF6600" };

  const roles: Record<string, { label: string; bg: string; text: string }> = {
    super_admin: { label: translate("superAdmin.users.roles.sadmin", { defaultValue: "S-ADMIN" }), ...orangeRole },
    manager: { label: translate("superAdmin.users.roles.manager", { defaultValue: "MANAGER" }), ...orangeRole },
    front_desk: { label: translate("superAdmin.users.roles.staff", { defaultValue: "STAFF" }), ...orangeRole },
  };

  if (roles[roleType]) return roles[roleType];

  if (roleLevel === 0) {
    return { label: translate("superAdmin.users.roles.blocked", { defaultValue: "BLOCKED" }), bg: "#FEE2E2", text: "#EF4444" };
  }

  return { label: translate("superAdmin.users.roles.user", { defaultValue: "USER" }), ...orangeRole };
};

export const UserRow = React.memo(function UserRow({ user, isFirst }: any) {
  const { t: translate } = useTranslation();
  const roleInfo = getRoleDetails(user.role_type, user.role, translate);
  const isDark = require('react-native').useColorScheme() === 'dark';
  return (
    <View 
      className="flex-row items-center p-3.5"
      style={{ borderTopWidth: isFirst ? 0 : 1, borderTopColor: isFirst ? 'transparent' : (isDark ? "#404040" : "#F8FAFC") }}
    >
      <Image
        source={{ uri: user.avatar }}
        style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: isDark ? "#262626" : "#F1F5F9" }}
      />
      <View className="ml-3 flex-1">
        <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{user.name || translate("superAdmin.users.defaultUserName")}</Text>
        <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextSecondary italic">{user.displayEmail}</Text>
      </View>
      <View style={{ backgroundColor: roleInfo.bg }} className="px-[10px] py-1 rounded-md">
        <Text style={{ color: roleInfo.text }} className="text-[9px] font-poppins-bold">{roleInfo.label}</Text>
      </View>
    </View>
  );
});