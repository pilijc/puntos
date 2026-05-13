import React from "react"
import { Modal, Linking, Alert } from "react-native"
import { View, Text, TouchableOpacity } from "@/tw"
import { createPayMongoPayment } from "@/services/store-manager/payment-service"
import { PaymentModalProps } from "@/type/store-manager/payment"
import { useTranslation } from "react-i18next";


export default function PaymentModal({
  setShowPaymentModal,
  userId,
  amount = 199,
}: PaymentModalProps) {
  const { t: translate } = useTranslation();
  
  const handlePayNow = async () => {
    try {
      const checkoutUrl = await createPayMongoPayment({
        user_id: userId,
        amount,
      })

      if (checkoutUrl) {
        Linking.openURL(checkoutUrl)
      } else {
        Alert.alert(
          translate("store_manager.subscription.registration.errorTitle"),
          translate("store_manager.subscription.registration.errorUnable")
        )
      }
    } catch (err) {
      console.error("Error calling payment function:", err)
      Alert.alert(
        translate("store_manager.subscription.registration.errorTitle"),
        translate("store_manager.subscription.registration.errorGeneric")
      )
    }
  }

  return (
<Modal transparent animationType="fade">
            <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
            }}
        >
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 items-center shadow-lg">

        
          {/* Icon */}
          <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
            <Text className="text-2xl">💳</Text>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-800 mb-1">
            {translate("store_manager.subscription.registration.title")}
          </Text>

          <Text className="text-gray-500 text-center mb-5">
            {translate("store_manager.subscription.registration.description")}
          </Text>

          {/* Amount Card */}
          <View className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 items-center mb-6">
            <Text className="text-gray-500 text-sm mb-1">{translate("store_manager.subscription.registration.amountToPay")}</Text>
            <Text className="text-3xl font-bold text-orange-500">
              ₱{amount}
            </Text>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            onPress={handlePayNow}
            className="w-full bg-orange-500 py-3 rounded-xl items-center mb-3 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {translate("store_manager.subscription.registration.payWithGcash")}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => setShowPaymentModal(false)}
            className="w-full border border-orange-500 py-3 rounded-xl items-center"
          >
            <Text className="text-orange-500 font-semibold">
              {translate("store_manager.subscription.registration.cancel")}
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </Modal>
  )
}