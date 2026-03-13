import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from '@/tw';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  const handleScanStore = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleShowVoucher = () => {
    router.push('/(user)/qr');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-poppins-bold text-gray-900 text-center">
            Scan & Earn
          </Text>
          <Text className="text-base font-poppins text-gray-600 text-center mt-2">
            ONE-TIME QR CODE FOR OPERATORS
          </Text>
        </View>

        {/* Camera View */}
        {showCamera ? (
          <View className="flex-1 bg-black rounded-3xl mb-6">
            {permission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              >
                <View className="absolute inset-0 bg-black/50" />
                <View className="absolute top-5 left-5 w-6 h-6 border-t-4 border-l-4 border-orange-500 border-solid rounded-sm" />
                <View className="absolute top-5 right-5 w-6 h-6 border-t-4 border-r-4 border-orange-500 border-solid rounded-sm" />
                <View className="absolute bottom-5 left-5 w-6 h-6 border-b-4 border-l-4 border-orange-500 border-solid rounded-sm" />
                <View className="absolute bottom-5 right-5 w-6 h-6 border-b-4 border-r-4 border-orange-500 border-solid rounded-sm" />
                <View className="absolute top-1/2 left-1/2 -mt-24 -ml-24 w-48 h-48 items-center justify-center">
                  <View className="w-48 h-48 border-2 border-white/30 rounded-lg" />
                </View>
              </CameraView>
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-900 p-5">
                <View className="w-16 h-16 bg-orange-500 rounded-2xl items-center justify-center mb-5">
                  <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
                </View>
                <Text className="text-base font-poppins-bold text-white mb-3">
                  Camera Access Required
                </Text>
                <Text className="text-sm font-poppins-medium text-gray-400 text-center mb-5">
                  Allow camera access to scan QR codes
                </Text>
                <TouchableOpacity
                  onPress={() => requestPermission()}
                  className="bg-orange-500 py-3 px-6 rounded-xl"
                >
                  <Text className="text-white font-poppins-bold text-center">
                    Enable Camera
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center mb-6">
            <View className="w-24 h-24 bg-gray-100 rounded-3xl items-center justify-center mb-6">
              <MaterialCommunityIcons name="qrcode-scan" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-poppins-semibold text-gray-700 text-center mb-2">
              Ready to Scan
            </Text>
            <Text className="text-sm font-poppins text-gray-500 text-center">
              Tap "Scan Store" to start scanning QR codes
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="space-y-4 mb-8">
          {/* Scan Store Button */}
          <TouchableOpacity
            onPress={handleScanStore}
            className="bg-orange-500 py-4 px-6 rounded-xl flex-row items-center justify-center shadow-lg"
          >
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#FFFFFF" />
            <Text className="text-white font-poppins-bold text-lg ml-3">
              Scan Store
            </Text>
          </TouchableOpacity>

          {/* Show Voucher Button */}
          <TouchableOpacity
            onPress={handleShowVoucher}
            className="bg-gray-100 py-4 px-6 rounded-xl flex-row items-center justify-center"
          >
            <MaterialIcons name="confirmation-number" size={24} color="#6B7280" />
            <Text className="text-gray-700 font-poppins-bold text-lg ml-3">
              Show Voucher
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {!showCamera && (
          <View className="bg-blue-50 p-4 rounded-xl mb-6">
            <View className="flex-row items-start">
              <MaterialIcons name="info" size={20} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-poppins-semibold text-blue-900 mb-1">
                  How it works
                </Text>
                <Text className="text-xs font-poppins text-blue-700">
                  Scan the store's QR code to earn points on your purchases. The more you shop, the more points you collect!
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}