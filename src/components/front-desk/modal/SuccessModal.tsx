import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {SuccessModalProps} from "@/type/frontdesk/props-modal/success";

export default function SuccessModal({ visible, onClose, successPoints }: SuccessModalProps) {
  const { t: translate } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      buttons={[{
        label: translate("frontdesk.transaction.success.scanAnother"),
        onPress: onClose,
        variant: "primary",
      }]}
    >
      <View className="items-center mb-5">
        <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
          <MaterialIcons name="check-circle" size={44} color="#10B981" />
        </View>
      </View>
      <Text className="text-2xl font-poppins-bold text-center text-neutral-900 dark:text-darkTextPrimary mb-1">
        {translate("frontdesk.transaction.success.title")}
      </Text>
      <Text className="text-sm font-poppins text-center text-neutral-400 mb-6">
        Points have been awarded successfully
      </Text>
      <View className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl py-6 px-8 mb-4 border border-orange-100 dark:border-orange-500/20">
        <Text className="text-5xl font-poppins-bold text-center text-orange-500">
          +{successPoints}
        </Text>
        <Text className="text-sm font-poppins-semibold text-center text-orange-400 mt-1">
          {translate("frontdesk.transaction.success.pointsAwarded")}
        </Text>
      </View>
    </Modal>
  );
}
