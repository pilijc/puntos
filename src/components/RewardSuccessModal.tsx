import React from "react";
import { View, Text } from "@/tw";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { CheckCircle2 } from "lucide-react-native";

interface RewardSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RewardSuccessModal({ visible, onClose }: RewardSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      showCloseButton={false}
    >
      <View className="items-center py-6">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
          <CheckCircle2 size={40} color="#10B981" />
        </View>
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-2 text-center">
          Reward Redeemed!
        </Text>
        <Text className="text-base font-poppins-medium text-neutral-600 text-center px-4 leading-relaxed">
          Your reward has been successfully redeemed. Enjoy your reward!
        </Text>
        {/* <View className="mt-6 w-full px-8">
          <Button
            label="Great!"
            onPress={onClose}
            variant="primary"
            fullWidth
          />
        </View> */}
      </View>
    </Modal>
  );
}
