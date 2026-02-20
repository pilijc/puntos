import React from "react";
import { View, Text } from "react-native";


export default function Scan() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base font-poppins-semibold text-textPrimary">
        QR Code Scanner
      </Text>
      <Text className="text-sm font-poppins mt-2 text-textSecondary text-center">
        This is where the QR code scanner will be implemented.
      </Text>
    </View>
  );
}