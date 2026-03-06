import React, { useState } from "react";
import { Modal, Alert, useColorScheme } from "react-native";
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
  const isDark = useColorScheme() === "dark";
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
              await softDeleteUserAccountService(user.id);
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
      <Modal animationType="slide" transparent statusBarTranslucent visible={visible} onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Scrim */}
          <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose} />

          {/* Sheet */}
          <View className="bg-background dark:bg-darkBackground rounded-t-[32px] px-6 pt-3 pb-8">
            {/* Handle */}
            <View className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-darkBackgroundCard self-center mb-5" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">Security</Text>
                <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">Manage your account security</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="h-10 w-10 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
              >
                <Ionicons name="close-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
              </TouchableOpacity>
            </View>

            {/* Change Password */}
            <TouchableOpacity
              className="py-4 rounded-2xl items-center bg-primary mb-3"
              onPress={() => setChangePasswordVisible(true)}
            >
              <Text className="text-white text-base font-poppins-bold">Change Password</Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              className="py-4 rounded-2xl items-center bg-danger"
              onPress={handleDeleteAccount}
            >
              <Text className="text-white text-base font-poppins-bold">Delete Account</Text>
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
