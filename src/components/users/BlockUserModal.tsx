import React from "react";
import { Image } from "react-native";
import { View, Text } from "@/tw";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "@/components/modal";
import { TYPO, COLORS, getBadge } from "./constants";
import type { UserRecord } from "@/store/user-store";

interface BlockUserModalProps {
  visible: boolean;
  selectedUser: UserRecord | null;
  willBlock: boolean;
  updatingUserId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function BlockUserModal({
  visible,
  selectedUser,
  willBlock,
  updatingUserId,
  onClose,
  onConfirm,
}: BlockUserModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={willBlock ? "Block User" : "Unblock User"}
      message={`Are you sure you want to ${willBlock ? "restrict" : "restore"} access for this user?`}
      buttons={[
        { label: "Cancel", onPress: onClose, variant: "secondary" },
        {
          label: willBlock ? "Block User" : "Unblock",
          onPress: onConfirm,
          variant: willBlock ? "danger" : "success",
          loading: updatingUserId === selectedUser?.id,
          disabled: updatingUserId === selectedUser?.id,
        },
      ]}
      dismissOnBackdrop
      showCloseButton
    >
      {selectedUser && (
        <View className="bg-backgroundMuted rounded-2xl p-4 border border-slate-100">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-12 rounded-xl overflow-hidden border border-slate-200 mr-3">
              <Image
                source={{ uri: selectedUser.imageUri || selectedUser.avatar }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-poppins-bold text-textPrimary">
                {selectedUser.name}
              </Text>
              <Text className={TYPO.subtitle}>
                {selectedUser.email || selectedUser.displayEmail}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-lg ${getBadge(selectedUser).bg}`}>
              <Text
                className={`text-[9px] font-poppins-bold uppercase ${getBadge(selectedUser).text}`}
              >
                {selectedUser.status === "Blocked"
                  ? "Blocked"
                  : (selectedUser.roleLabel || "User")}
              </Text>
            </View>
          </View>
          {selectedUser.roleLabel === "Manager" &&
            (selectedUser.stores?.length ?? 0) > 0 && (
              <View>
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider mb-2">
                  Stores Managed
                </Text>
                {selectedUser.stores!.map((store: string, i: number) => (
                  <View
                    key={i}
                    className="flex-row items-center bg-white border border-slate-100 rounded-xl px-3 py-2 mb-1.5"
                  >
                    <MaterialIcons
                      name="storefront"
                      size={14}
                      color={COLORS.textMuted}
                    />
                    <Text className="text-[12px] font-poppins text-textSecondary ml-2">
                      {store}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          {selectedUser.roleLabel === "Staff" &&
            (selectedUser.stores?.length ?? 0) > 0 && (
              <View>
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider mb-2">
                  Branch Location
                </Text>
                <View className="flex-row items-center bg-primary rounded-xl px-4 py-3">
                  <MaterialIcons name="location-on" size={14} color="white" />
                  <Text className="text-[12px] font-poppins-bold text-white flex-1 ml-2">
                    {selectedUser.stores![0]}
                  </Text>
                </View>
              </View>
            )}
        </View>
      )}
    </Modal>
  );
}
