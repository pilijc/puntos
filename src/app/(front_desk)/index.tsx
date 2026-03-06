import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { processFrontDeskScan, getCurrentUserStore } from "@/services/operator-service";

export default function FrontDeskScan() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(true);
  const [recentScans, setRecentScans] = useState<Array<{points: number; timestamp: Date; amount: number}>>([]);
  const [storeInfo, setStoreInfo] = useState<{name: string; id: number} | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      const storeInfo = await getCurrentUserStore();
      setStoreInfo(storeInfo);
    };

    fetchStoreInfo();
  }, []);

  const handleStartScanning = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid purchase amount greater than 0.");
      return;
    }
    setShowAmountInput(false);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      const amount = parseFloat(purchaseAmount);
      const result = await processFrontDeskScan(data, amount);

      if (result.success) {
        // Calculate the points that were awarded (we need to get this from the transaction)
        // For now, we'll calculate it based on the percentage logic we implemented
        const amount = parseFloat(purchaseAmount);
        // Note: We should ideally get the actual points from the transaction response
        // For now, we'll estimate based on the logic
        
        Alert.alert(
          "✅ Success!",
          `Points awarded to customer!\nTransaction ID: ${result.transactionId}`,
          [
            {
              text: "Scan Another",
              onPress: () => {
                // Add this scan to recent scans before resetting
                const pointsAwarded = Math.floor(amount * 0.1); // Assuming 10% for now, should be dynamic
                setRecentScans(prev => [{
                  points: pointsAwarded,
                  timestamp: new Date(),
                  amount: amount
                }, ...prev.slice(0, 4)]); // Keep only last 5 scans
                
                setScanned(false);
                setIsProcessing(false);
                setShowCamera(false);
                setShowAmountInput(true);
                setPurchaseAmount("");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message, [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert("Error", "Failed to process QR code. Please try again.", [
        {
          text: "OK",
          onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          },
        },
      ]);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-orange-500 pt-20 px-5 pb-10 rounded-b-3xl">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white">
              Scan QR Code
            </Text>
            <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center bg-white/20">
              <MaterialIcons name="help-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {/* Store Info */}
          {storeInfo && (
            <View className="bg-white/10 p-2 rounded-lg mb-2">
              <Text className="text-sm text-white/80 text-center">
                {storeInfo.name}
              </Text>
            </View>
          )}
          {/* Status indicator */}
          <View className="bg-white/20 p-3 rounded-xl mt-5">
            <View className={`w-2 h-2 rounded-full ${showCamera ? 'bg-green-400' : 'bg-yellow-400'} mr-3`} />
            <Text className="text-sm text-white">
              {showCamera ? 'Camera Active' : 'Ready to Scan'}
            </Text>
          </View>
        </View>

        {/* Purchase Amount Input or Scanner Card */}
        {showAmountInput ? (
          <View className="bg-white rounded-3xl p-5 -mt-10 shadow-lg shadow-black/10 elevation-10">
            <View className="items-center py-5">
              <MaterialIcons name="attach-money" size={48} color="#FF6F00" />
              <Text className="text-xl font-bold text-gray-700 mt-4 mb-3">Enter Purchase Amount</Text>
              <Text className="text-sm text-gray-500 text-center mb-8">
                Enter the customer's purchase amount to calculate points
              </Text>
              <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-5 py-4 mb-8 w-full">
                <Text className="text-lg font-bold text-gray-700 mr-3">₱</Text>
                <TextInput
                  className="flex-1 text-lg font-bold text-gray-700"
                  value={purchaseAmount}
                  onChangeText={setPurchaseAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={handleAmountSubmit} className="bg-orange-500 py-4 px-5 rounded-xl shadow-lg shadow-black/10 elevation-10 w-full">
                <Text className="text-white font-bold text-base text-center">Continue to Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-5 -mt-10 shadow-lg shadow-black/10 elevation-10">
            {showCamera ? (
              <View className="bg-black rounded-3xl h-75">
                {permission?.granted ? (
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  >
                    {/* Scan Overlay */}
                    <View className="absolute inset-0 bg-black/50" />
                    
                    {/* Corner Markers */}
                    <View className="absolute top-5 left-5 w-6 h-6 border-t-4 border-l-4 border-orange-500 border-solid rounded-sm" />
                    <View className="absolute top-5 right-5 w-6 h-6 border-t-4 border-r-4 border-orange-500 border-solid rounded-sm" />
                    <View className="absolute bottom-5 left-5 w-6 h-6 border-b-4 border-l-4 border-orange-500 border-solid rounded-sm" />
                    <View className="absolute bottom-5 right-5 w-6 h-6 border-b-4 border-r-4 border-orange-500 border-solid rounded-sm" />
                    
                    {/* Scan Area Indicator */}
                    <View className="absolute top-1/2 left-1/2 -mt-24 -ml-24 w-48 h-48 items-center justify-center">
                      <View className="w-48 h-48 border-2 border-white/30 rounded-lg" />
                    </View>
                  </CameraView>
                ) : (
                  <View className="flex-1 items-center justify-center bg-gray-900 p-5">
                    <View className="w-16 h-16 bg-orange-500 rounded-2xl items-center justify-center mb-5">
                      <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
                    </View>
                    <Text className="text-base font-bold text-white mb-3">
                      Camera Access Required
                    </Text>
                    <Text className="text-sm text-gray-400 text-center mb-5">
                      Allow camera access to scan QR codes and award points to customers
                    </Text>
                    <TouchableOpacity
                      onPress={() => requestPermission()}
                      className="bg-orange-500 py-4 px-5 rounded-xl shadow-lg shadow-black/10 elevation-10"
                    >
                      <Text className="text-white font-bold text-center">Enable Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-1 h-75 items-center justify-center bg-gray-100 rounded-3xl">
                <MaterialIcons name="qr-code-scanner" size={64} color="#9CA3AF" />
                <Text className="text-base text-gray-500 mt-4 text-center">
                  Tap "Start Scanning" to begin
                </Text>
              </View>
            )}

            {/* Instructions */}
            <View className="mt-5">
              <View className="flex-row items-center justify-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <Text className="text-sm text-gray-700 font-medium">
                  Position QR code within the frame
                </Text>
              </View>
              <Text className="text-xs text-gray-500 text-center mt-3">
                The scanner will automatically detect and process the QR code
              </Text>
            </View>

            {/* Action Button */}
            <View className="mt-5">
              <TouchableOpacity onPress={handleStartScanning} className="bg-orange-500 py-4 px-5 rounded-xl shadow-lg shadow-black/10 elevation-10">
                <Text className="text-white font-medium text-center">Start Scanning</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View className="p-5">
          <Text className="text-base font-bold text-gray-700 mb-4">Recent Scans</Text>
          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <View key={index} className="bg-white p-4 rounded-xl shadow-md shadow-black/5 elevation-5 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-green-100 rounded-2xl items-center justify-center mr-4">
                      <MaterialIcons name="check" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-700">₱{scan.amount.toFixed(2)} Purchase</Text>
                      <Text className="text-xs text-gray-500">{formatTimeAgo(scan.timestamp)}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-bold text-orange-500">+{scan.points} pts</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white p-4 rounded-xl shadow-md shadow-black/5 elevation-5">
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="history" size={20} color="#9CA3AF" />
                <Text className="text-sm font-medium text-gray-500 ml-3">
                  No recent scans
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}








