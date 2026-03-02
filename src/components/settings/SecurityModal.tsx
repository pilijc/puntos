import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import ChangePasswordModal from "./ChangePasswordModal";
import { supabase } from "@/supabase/supabase";
import { router } from "expo-router";
import { softDeleteUserAccountService } from "@/services/settings-service";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SecurityModal({ visible, onClose }: Props) {
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (userError || !user) throw new Error("Could not find user.");

              // Soft-delete user by setting deleted_at
              await softDeleteUserAccountService(user.id);

              // Sign out and redirect
              await supabase.auth.signOut();
              onClose();
              router.replace("/(onboarding)/welcome");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <SafeAreaView className="flex-1">
          <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose} />

          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-poppins-bold text-neutral-900">Security</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-outline" size={25} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="mx-4 mb-6 p-4 bg-primary rounded-2xl items-center border border-neutral-200"
              onPress={() => setChangePasswordVisible(true)}
            >
              <Text className="text-white text-base font-poppins-semibold">Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mx-4 mb-6 p-4 bg-danger rounded-2xl items-center"
              onPress={handleDeleteAccount}
            >
              <Text className="text-white text-base font-poppins-semibold">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />
    </>
  );
}
