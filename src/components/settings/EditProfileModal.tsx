import React, { useState, useEffect } from "react";
import { Modal, ActivityIndicator, KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialUsername?: string;
  initialEmail?: string;
  onSave: (newName: string, newEmail: string) => Promise<void>;
};

export default function EditProfileModal({
  visible,
  onClose,
  initialUsername = "",
  initialEmail = "",
  onSave,
}: Props) {
  const isDark = useColorScheme() === "dark";

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(initialUsername);
      setEmail(initialEmail);
    }
  }, [visible, initialUsername, initialEmail]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(username, email);
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={"padding"}
        style={{ flex: 1 }}
      >
        {/* Scrim */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <SafeAreaView className="bg-background dark:bg-darkBackground rounded-t-[32px]">
            <View className="px-6 pt-3 pb-2">
              {/* Handle */}
              <View className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-darkBackgroundCard self-center mb-5" />

              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">Edit Profile</Text>
                  <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">Update your account information</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="h-10 w-10 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
                >
                  <Ionicons name="close-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Username */}
                <View className="mb-4">
                  <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Username</Text>
                  <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                    <Ionicons name="person-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                    <TextInput
                      className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                      placeholder="Enter username"
                      value={username}
                      onChangeText={setUsername}
                      placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                      editable={!isSaving}
                    />
                  </View>
                </View>

                {/* Email */}
                <View className="mb-6">
                  <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Email Address</Text>
                  <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                    <Ionicons name="mail-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                    <TextInput
                      className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                      placeholder="Enter email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                      editable={false}
                    />
                  </View>
                  <Text className="text-[10px] font-poppins-regular text-neutral-400 dark:text-darkTextMuted mt-1.5 ml-1">
                    Email verification is required to update your email address.
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSaving}
                    className="flex-1 py-4 rounded-2xl items-center bg-neutral-100 dark:bg-darkBackgroundMuted"
                  >
                    <Text className="text-neutral-900 dark:text-darkTextSoftest font-poppins-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className={`flex-1 py-4 rounded-2xl items-center bg-primary ${isSaving ? "opacity-60" : ""}`}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-poppins-bold">Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
