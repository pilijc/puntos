import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from '@/tw';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function Redeem() {
  const router = useRouter();

  // Example: dynamic one-time code
    const qrValue = "PUNTOS_USER_12345"; 
  // Later you can replace this with:
  // const qrValue = user.id + "_" + Date.now();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="px-2 py-2">
            <MaterialIcons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-poppins-semibold text-textPrimary">
            Show QR Code
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <Text className="text-sm font-poppins mt-4 text-textSecondary text-center">
          Let the operator scan your QR code
        </Text>
        <Text className="text-xs font-poppins mt-1 text-textMuted text-center">
          This code is unique and one-time use
        </Text>



        <View className="mt-6 items-center">
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>
        </View>

        <View className="flex-row items-center justify-center mt-6">
          <TouchableOpacity style={styles.refreshButton}>
            <Text className="text-base font-poppins-semibold text-background">
              Generate New Code
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-poppins text-textMuted text-center mt-6">
          ONE-TIME QR CODE FOR OPERATORS
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  qrContainer: {
    width: 280,
    height: 280,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  refreshButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
});