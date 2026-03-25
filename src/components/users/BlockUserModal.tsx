import React from "react";
import { Image } from "react-native";
import { View, Text } from "@/tw";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "@/components/modal";
import { TYPO, COLORS, getBadge } from "./constants";
import type { UserRecord } from "@/store/super-admin/user-store";

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
            (selectedUser.storeInfo?.length ?? 0) > 0 && (
              <View>
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider mb-2">
                  Managed Stores
                </Text>
                {selectedUser.storeInfo!.map((store: any, i: number) => (
                  <View key={i} className="bg-white border border-slate-100 rounded-2xl p-3 mb-2">
                    <View className="flex-row items-center">
                      <View className="bg-primary/10 p-2 rounded-lg">
                        <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[13px] font-poppins-bold text-textPrimary">
                          {store.name}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <MaterialIcons name="location-on" size={10} color={COLORS.primary} />
                          <Text className="text-[10px] font-poppins text-textMuted ml-1" numberOfLines={1}>
                            {store.address}
                          </Text>
                        </View>
                        {store.ownerName && (
                          <View className="flex-row items-center mt-1">
                            <MaterialIcons name="person" size={10} color={COLORS.primary} />
                            <Text className="text-[10px] font-poppins text-primary ml-1">
                              Owner: {store.ownerName}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          {selectedUser.roleLabel === "Staff" &&
            (selectedUser.storeInfo?.length ?? 0) > 0 && (
              <View>
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider mb-2">
                  Branch Assignment
                </Text>
                {selectedUser.storeInfo!.map((store: any, i: number) => (
                  <View key={i} className="bg-white border border-slate-100 rounded-2xl p-3 mb-2">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-primary/10 p-2 rounded-lg">
                        <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[13px] font-poppins-bold text-textPrimary">
                          {store.name}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <MaterialIcons name="location-on" size={10} color={COLORS.primary} />
                          <Text className="text-[10px] font-poppins text-textMuted ml-1" numberOfLines={1}>
                            {store.address}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {(store.ownerName || store.managerName) && (
                      <View className="flex-row items-center bg-slate-50 rounded-lg px-2.5 py-1.5 mt-1 border border-slate-100/50">
                        <MaterialIcons name="person" size={12} color={COLORS.primary} />
                        <Text className="text-[10px] font-poppins-bold text-textSecondary ml-1.5 flex-1">
                          {store.ownerName || store.managerName}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
        </View>
      )}
    </Modal>
  );
}
