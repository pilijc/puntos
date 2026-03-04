import React, { useState, useEffect } from "react";
import { Modal, KeyboardAvoidingView, useColorScheme, ActivityIndicator } from "react-native";
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
  const isDark = useColorScheme() === 'dark';

  // Local state for form inputs
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when modal opens or initial values change
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
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/40"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom sheet anchored to bottom */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <SafeAreaView className="bg-white dark:bg-neutral-900 rounded-t-[32px] shadow-2xl">
            <View className="p-6 pb-10">
              <View className="w-12 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full self-center mb-6" />

              {/* Header Content */}
              <View className="flex-row justify-between items-center mb-8">
                <View>
                  <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">Edit Profile</Text>
                  <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-neutral-400">Update your account information</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="h-10 w-10 bg-neutral-50 dark:bg-neutral-800 rounded-full items-center justify-center"
                >
                  <Ionicons name="close-outline" size={24} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Username Input Field */}
                <View className="mb-5">
                  <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">Username</Text>
                  <View className="flex-row items-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-4 py-1">
                    <Ionicons name="person-outline" size={20} color={isDark ? "#6b7280" : "#9CA3AF"} />
                    <TextInput
                      className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-white"
                      placeholder="Enter username"
                      value={username}
                      onChangeText={setUsername}
                      placeholderTextColor={isDark ? '#4b5563' : '#9CA3AF'}
                      editable={!isSaving}
                    />
                  </View>
                </View>

                {/* Email Input Field */}
                <View className="mb-8">
                  <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">Email Address</Text>
                  <View className="flex-row items-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-4 py-1">
                    <Ionicons name="mail-outline" size={20} color={isDark ? "#6b7280" : "#9CA3AF"} />
                    <TextInput
                      className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-white"
                      placeholder="Enter email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={isDark ? '#4b5563' : '#9CA3AF'}
                      editable={false} // Keeping email non-editable for now as it requires verification in Supabase
                    />
                  </View>
                  <Text className="text-[10px] font-poppins-regular text-neutral-400 dark:text-neutral-500 mt-2 ml-1">
                    Email verification is required to update your email address.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-4 mt-2">
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSaving}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-800 py-4 rounded-2xl items-center active:bg-neutral-200 dark:active:bg-neutral-700"
                  >
                    <Text className="text-neutral-900 dark:text-neutral-200 font-poppins-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className={`flex-1 ${isSaving ? 'bg-primary/70' : 'bg-primary'} py-4 rounded-2xl items-center shadow-lg shadow-primary/20 active:bg-primary/90`}
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
