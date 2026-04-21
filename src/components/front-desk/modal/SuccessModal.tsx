import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {SuccessModalProps} from "@/type/frontdesk/props-modal/success";

export default function SuccessModal({ visible, onClose, successPoints, type = "earn" }: SuccessModalProps) {
  const { t: translate } = useTranslation();

  const isRedeem = type === "redeem";

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
        <View className={`w-20 h-20 ${isRedeem ? "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"} rounded-3xl items-center justify-center border`}>
          <MaterialIcons name="check-circle" size={44} color={isRedeem ? "#8B5CF6" : "#10B981"} />
        </View>
      </View>
      <Text className="text-2xl font-poppins-bold text-center text-neutral-900 dark:text-darkTextPrimary mb-1">
        {isRedeem ? "Reward Redeemed!" : translate("frontdesk.transaction.success.title")}
      </Text>
      <Text className="text-sm font-poppins text-center text-neutral-400 mb-6">
        {isRedeem ? "Reward has been redeemed successfully" : "Points have been awarded successfully"}
      </Text>
      <View className={`${isRedeem ? "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" : "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20"} rounded-2xl py-6 px-8 mb-4 border`}>
        <Text className={`text-5xl font-poppins-bold text-center ${isRedeem ? "text-purple-500" : "text-orange-500"}`}>
          {isRedeem ? `-${successPoints}` : `+${successPoints}`}
        </Text>
        <Text className={`text-sm font-poppins-semibold text-center ${isRedeem ? "text-purple-400" : "text-orange-400"} mt-1`}>
          {isRedeem ? "points redeemed" : translate("frontdesk.transaction.success.pointsAwarded")}
        </Text>
      </View>
    </Modal>
  );
}
