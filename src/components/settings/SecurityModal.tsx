import React from "react";
import { Modal } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import ChangePasswordModal from "./ChangePasswordModal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SecurityModal({ visible, onClose }: Props) {
  const [changePasswordVisible, setChangePasswordVisible] = React.useState(false);

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

            <TouchableOpacity className="mx-4 mb-6 p-4 bg-danger rounded-2xl items-center">
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
