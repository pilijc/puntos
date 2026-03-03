import React from "react";
import { Modal, Platform, KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput } from "@/tw";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  username: string;
  email: string;
  setUsername: (v: string) => void;
  setEmail: (v: string) => void;
  onSave: () => void;
};

export default function EditProfileModal({
  visible,
  onClose,
  username,
  email,
  setUsername,
  setEmail,
  onSave,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1">
        <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView>
          <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-6 pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white">Edit Profile</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-outline" size={25} color="#FF0000" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-neutral-300 mb-2">Username</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 font-poppins-regular text-neutral-900 dark:text-white dark:bg-neutral-700"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-neutral-300 mb-2">Email</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 font-poppins-regular text-neutral-900 dark:text-white dark:bg-neutral-700"
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 border border-neutral-300 dark:border-neutral-600 py-3 rounded-lg items-center">
                <Text className="text-neutral-900 dark:text-neutral-200 font-poppins-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSave} className="flex-1 bg-primary py-3 rounded-lg items-center">
                <Text className="text-white font-poppins-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
