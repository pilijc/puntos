import React from "react";
import { Modal, Platform, KeyboardAvoidingView } from "react-native";
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
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1">
        <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView>
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-poppins-bold text-neutral-900">Edit Profile</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-outline" size={25} color="#FF0000" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-poppins-semibold text-neutral-700 mb-2">Username</Text>
              <TextInput
                className="border rounded-lg p-3 font-poppins-regular text-neutral-900"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-poppins-semibold text-neutral-700 mb-2">Email</Text>
              <TextInput
                className="border rounded-lg p-3 font-poppins-regular text-neutral-900"
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 border border-neutral-300 py-3 rounded-lg items-center">
                <Text className="text-neutral-900 font-poppins-semibold">Cancel</Text>
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
