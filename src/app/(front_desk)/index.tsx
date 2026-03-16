import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { processFrontDeskScan, getCurrentUserStore } from "@/services/operator-service";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";

export default function FrontDeskScan() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{points: number; timestamp: Date; amount: number}>>([]);
  const [storeInfo, setStoreInfo] = useState<{name: string; id: number} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransactionId, setSuccessTransactionId] = useState<string>("");
  const [successPoints, setSuccessPoints] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanning" | "transactions">("scanning");
  const [modal, setModal] = useState<{
  title: string;
  message: string;
  buttons: ModalButton[];
} | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      const storeInfo = await getCurrentUserStore();
      setStoreInfo(storeInfo);
    };

    fetchStoreInfo();
  }, []);
  
  useEffect(() => {
    const handleQRPress = async () => {
        setShowPriceModal(true);
        router.replace("/(front_desk)");
    };
    
    (global as any).handleCenterQRButton = handleQRPress;
    
    // Also set up a backup handler
    (global as any).openPriceModal = handleQRPress;
    
    // Don't clean up the handler to keep it persistent across tabs
    return () => {
      // Keep handlers persistent
      (global as any).handleCenterQRButton = handleQRPress;
      (global as any).openPriceModal = handleQRPress;
    };
  }, []);

  const handleStartScanning = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleAmountSubmit = async () => {
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setModal({
        title: "Invalid Amount",
        message: "Please enter a valid purchase amount greater than 0.",
        buttons: [
          {
            label: "OK",
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      return;
    }
    setShowPriceModal(false);    
    setTimeout(() => {
      router.replace('/(front_desk)');
      setShowCamera(true);
    }, 300);
  };

  const handlePriceModalCancel = () => {
    setShowPriceModal(false);
    setActiveTab("transactions");
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      const amount = parseFloat(purchaseAmount);
      const result = await processFrontDeskScan(data, amount);

      if (result.success) {
        
        const amount = parseFloat(purchaseAmount);
        const pointsAwarded = result.pointsEarned || Math.ceil(amount * 0.1); 
        
        setSuccessTransactionId(result.transactionId || "");
        setSuccessPoints(pointsAwarded);
        setShowSuccessModal(true);
      } else {
         setModal({
          title: "QR Code Failed",
          message: result.message || "Failed to process QR code. Please try again.",
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: () => setModal(null),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      setModal({
          title: "QR Code Failed",
          message: "Something went wrong. Please try again.",
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: () => setModal(null),
            },
          ],
        });
          setModal({
          title: "QR Code Failed",
          message: "Failed to process QR code. Please try again.",
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: () => setModal(null),
            },
          ],
        });
     
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

  const handleModalClose = () => {
    
    const amount = parseFloat(purchaseAmount);
    setRecentScans(prev => [{
      points: successPoints,
      timestamp: new Date(),
      amount: amount
    }, ...prev.slice(0, 4)]); 
    
     
    setScanned(false);
    setIsProcessing(false);
    setShowCamera(false);
    setPurchaseAmount("");
    setShowSuccessModal(false);
  };

  const handleErrorModalClose = () => {
    setScanned(false);
    setIsProcessing(false);
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <View className="flex-1 bg-muted-white">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <ScrollView className="flex-1 bg-muted-white" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-orange-500 pt-20 px-5 pb-10 rounded-b-3xl">
          <View className="flex-row items-center justify-between">
            {/* <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity> */}
            <Text className="text-lg font-bold text-white">
              Scan QR Code
            </Text>
          </View>
          
          {/* Store Info */}
          {storeInfo && (
            <View className="bg-white from-orange-50 to-orange-100 p-5 rounded-3xl mb-6 items-center shadow-sm">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-orange-500 rounded-2xl items-center justify-center mr-4">
                  <MaterialIcons name="store" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-poppins-medium text-orange-600 uppercase tracking-wider mb-1">
                    Current Store
                  </Text>
                  <Text className="text-xl font-poppins-bold text-gray-900">
                    {storeInfo.name}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
        </View>

        {/* Scanner Card */}
        <View className="bg-white rounded-3xl p-6 -mt-6 shadow-lg shadow-black/10 elevation-10 mx-5">
          {showCamera ? (
            <View className="bg-black rounded-3xl h-75">
              {permission?.granted ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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
                    Allow camera access to scan QR codes and award points to customers
                  </Text>
                  <Button
                    label="Enable Camera"
                    onPress={() => requestPermission()}
                    fullWidth
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1 h-75 items-center justify-center bg-white-100 rounded-3xl">
              <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-6">
                <MaterialIcons name="qr-code-scanner" size={32} color="#FF6600" />
              </View>
              <Text className="text-xl font-poppins-bold text-gray-900 mb-3">Ready to Scan</Text>
              <Text className="text-base font-poppins text-gray-600 text-center mb-8">
                Enter purchase amount to start scanning QR codes
              </Text>
            </View>
          )}  

          {showCamera && (
            <View className="mt-5">
              <View className="flex-row items-center justify-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <Text className="text-sm font-poppins-medium text-gray-700">
                  Position QR code within the frame
                </Text>
              </View>
              <Text className="text-xs font-poppins-medium text-gray-500 text-center mt-3">
                The scanner will automatically detect and process the QR code
              </Text>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View className="px-5 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-poppins-bold text-gray-900">Recent Transactions</Text>
            <TouchableOpacity>
              <Text className="text-sm font-poppins-medium text-orange-600">See all</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <View key={index} className="bg-white p-4 rounded-xl shadow-md shadow-black/5 elevation-5 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-green-100 rounded-2xl items-center justify-center mr-4">
                      <MaterialIcons name="check" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-sm font-poppins text-gray-700">₱{scan.amount.toFixed(2)} Purchase</Text>
                      <Text className="text-xs font-poppins text-gray-500">{formatTimeAgo(scan.timestamp)}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-poppins-bold text-orange-500">+{scan.points} pts</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white p-4 rounded-xl shadow-md shadow-black/5 elevation-5">
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="history" size={20} color="#9CA3AF" />
                <Text className="text-sm font-poppins text-white-500 ml-3">
                  No transactions yet
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Price Input Modal */}
      <Modal
        visible={showPriceModal}
        onClose={handlePriceModalCancel}
        title=""
        buttons={[
          {
            label: "Cancel",
            onPress: handlePriceModalCancel,
            variant: "secondary"
          },
          {
            label: "Continue",
            onPress: handleAmountSubmit,
            variant: "primary"
          }
        ]}
      >
        {/* Price Input */}
        <View className="items-center py-6">
          <View className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <MaterialIcons name="attach-money" size={32} color="#FF6600" />
          </View>
          <Text className="text-2xl font-poppins-bold text-gray-900 mb-3">Enter Purchase Amount</Text>
          <Text className="text-base font-poppins text-gray-600 text-center mb-8">
            Enter the customer's purchase amount to calculate points
          </Text>
          <View className="flex-row items-center border-2 border-gray-300 rounded-2xl px-6 py-5 mb-8 w-full">
            <Text className="text-xl font-poppins-bold text-gray-700 mr-3">₱</Text>
            <TextInput
              className="flex-1 text-xl font-poppins-bold text-gray-700"
              value={purchaseAmount}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9.]/g, '');
                const parts = numericText.split('.');
                const filteredText = parts.length > 2 
                  ? parts[0] + '.' + parts.slice(1).join('') 
                  : numericText;
                setPurchaseAmount(filteredText);
              }}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
              maxLength={7}
            />
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title=""
        buttons={[
          {
            label: "Scan Another",
            onPress: handleModalClose,
            variant: "primary"
          }
        ]}
      >
        {/* Success Icon */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-500 rounded-2xl items-center justify-center">
            <MaterialIcons name="check" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-poppins-bold text-center text-gray-900 mb-2">
          Success!
        </Text>

        {/* Transaction ID */}
        <Text className="text-base font-poppins-medium text-center text-gray-600 mb-6">
          Transaction ID: {successTransactionId}
        </Text>

        {/* Points Display */}
        <View className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
          <Text className="text-3xl font-poppins-bold text-center text-orange-600">
            +{successPoints}
          </Text>
          <Text className="text-sm font-poppins-medium text-center text-orange-500 mt-1">
            Points Awarded
          </Text>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        title=""
        buttons={[
          {
            label: "Try Again",
            onPress: handleErrorModalClose,
            variant: "primary"
          }
        ]}
      >
        {/* Error Icon */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-red-500 rounded-2xl items-center justify-center">
            <MaterialIcons name="error" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-poppins-bold text-center text-gray-900 mb-2">
          Error
        </Text>

        {/* Error Message */}
        <Text className="text-base font-poppins-medium text-center text-gray-600 mb-8">
          {errorMessage}
        </Text>
      </Modal>

    </View>
  );
}








