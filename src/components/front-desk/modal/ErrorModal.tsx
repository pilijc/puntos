import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {ErrorModalProps} from "@/type/frontdesk/props-modal/error";

export default function ErrorModal({ visible, onClose, errorMessage }: ErrorModalProps) {
  const { t: translate } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      buttons={[{
        label: translate("label.tryAgain"),
        onPress: onClose,
        variant: "primary",
      }]}
    >
      <View className="items-center mb-5">
        <View className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl items-center justify-center border border-red-100 dark:border-red-500/20">
          <MaterialIcons name="error-outline" size={44} color="#EF4444" />
        </View>
      </View>
      <Text className="text-2xl font-poppins-bold text-center text-neutral-900 dark:text-darkTextPrimary mb-2">
        Something went wrong
      </Text>
      <Text className="text-sm font-poppins text-center text-neutral-500 dark:text-darkTextSecondary mb-6 px-4">
        {errorMessage}
      </Text>
    </Modal>
  );
}
