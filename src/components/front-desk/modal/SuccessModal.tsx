import React from "react";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {SuccessModalProps} from "@/type/frontdesk/props-modal/success";
import { Image } from "expo-image";

export default function SuccessModal({ visible, onClose, successPoints, type = "earn", rewardName, rewardImage }: SuccessModalProps) {
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
        <View className={`w-20 h-20 ${isRedeem ? "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"} rounded-3xl items-center justify-center border`}>
          <MaterialIcons name="check-circle" size={44} color={isRedeem ? "#22C55E" : "#22C55E"} />
        </View>
      </View>
      <Text className="text-2xl font-poppins-bold text-center text-neutral-900 dark:text-darkTextPrimary mb-1">
        {isRedeem ? "Reward Redeemed!" : translate("frontdesk.transaction.success.title")}
      </Text>
      <Text className="text-sm font-poppins text-center text-neutral-400 mb-6">
        {isRedeem ? "Reward has been redeemed successfully" : "Points have been awarded successfully"}
      </Text>
      <View className={`${isRedeem ? "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20" : "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20"} rounded-2xl py-6 px-8 mb-4 border`}>
        {isRedeem && rewardName ? (
          <>
            {rewardImage && (
              <View className="w-16 h-16 mb-3 mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  source={{ uri: rewardImage }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  placeholder="Reward Image"
                  placeholderContentFit="cover"
                />
              </View>
            )}
            <Text className={`text-2xl font-poppins-bold text-center text-orange-500`}>
              {rewardName}
            </Text>
            <Text className={`text-sm font-poppins-semibold text-center text-orange-400 mt-1`}>
              Reward redeemed successfully
            </Text>
          </>
        ) : (
          <>
            <Text className={`text-5xl font-poppins-bold text-center ${isRedeem ? "text-orange-500" : "text-orange-500"}`}>
              {isRedeem ? `-${successPoints}` : `+${successPoints}`}
            </Text>
            <Text className={`text-sm font-poppins-semibold text-center ${isRedeem ? "text-orange-40" : "text-orange-400"} mt-1`}>
              {isRedeem ? "points redeemed" : translate("frontdesk.transaction.success.pointsAwarded")}
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}
