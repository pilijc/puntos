import React from "react";
import { Modal } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  role?: string | null;
  onToggleRole: () => void;
};

export default function StoreOwnerModal({ visible, onClose, role, onToggleRole }: Props) {
  const isStore = role === "store_owner";

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1">
        <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose} />

        <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-6 pb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white">Become a store owner</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={25} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-base font-poppins-regular text-neutral-700 dark:text-neutral-300 mb-2">
              Current role: {role || "user"}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Toggle your account role to register as a store owner. You can switch back anytime.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 border border-neutral-300 dark:border-neutral-600 py-3 rounded-lg items-center">
              <Text className="text-neutral-900 dark:text-neutral-200 font-poppins-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleRole} className="flex-1 bg-primary py-3 rounded-lg items-center">
              <Text className="text-white font-poppins-semibold">{isStore ? "Revoke store owner" : "Become a store owner"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
