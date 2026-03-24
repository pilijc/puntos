import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { Alert, useColorScheme } from "react-native";
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput } from "@/tw";
import { Animated, Dimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { processFrontDeskScan, getCurrentUserStore } from "@/services/frontdesk/scan-service";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { useTranslation } from "react-i18next";
import { legacy_makeMutableUI } from "react-native-reanimated/lib/typescript/mutables";
 
export default function FrontDeskScan() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const { recentScans, fetchTransactions, addScan } = useRecentTransactions();
  const [storeInfo, setStoreInfo] = useState<{ name: string; id: number } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransactionId, setSuccessTransactionId] = useState<string>("");
  const [successPoints, setSuccessPoints] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { t: translate } = useTranslation();
  const ColorScheme = useColorScheme();
  const isDark = ColorScheme === "dark";
  const [activeTab, setActiveTab] = useState<"scanning" | "transactions">("scanning");
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [voucherCode, setVoucherCode] = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const fetchStoreInfo = async () => {
      const storeInfo = await getCurrentUserStore();
      setStoreInfo(storeInfo);
      if (storeInfo) {
        fetchTransactions(storeInfo.id);
      }
    };

    fetchStoreInfo();
  }, []);

  const handleStartScanning = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setModal({
        title: translate("frontdesk.transaction.error.amount.invalid"),
        message: translate("frontdesk.transaction.error.amount.lessThanZero"),
        buttons: [
          {
            label: translate("label.ok"),
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      return;
    }

    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleManualInputSubmit = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setModal({
        title: translate("frontdesk.transaction.error.amount.invalid"),
        message: translate("frontdesk.transaction.error.amount.lessThanZero"),
        buttons: [
          {
            label: translate("label.ok"),
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      return;
    }

    if (!voucherCode.trim()) {
      setModal({
        title: "Voucher Code Required",
        message: "Please enter a voucher code to proceed.",
        buttons: [
          {
            label: translate("label.ok"),
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      return;
    }

    // Process the voucher code here
    // For now, just show a placeholder
    setModal({
      title: "Processing Code",
      message: `Processing code: ${voucherCode} for amount: ₱${purchaseAmount}`,
      buttons: [
        {
          label: translate("label.ok"),
          variant: "secondary",
          onPress: () => setModal(null),
        },
      ],
    });
  };

  const switchToQR = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setInputMode("qr");
  };

  const switchToManual = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setInputMode("manual");
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
          title: translate("frontdesk.transaction.error.qr.title"),
          message: result.message || translate("frontdesk.transaction.error.qr.description"),
          buttons: [
            {
              label: translate("label.ok"),
              variant: "secondary",
              onPress: () => setModal(null),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      setModal({
        title: translate("frontdesk.transaction.error.qr.title"),
        message: translate("label.somethingWentWrong"),
        buttons: [
          {
            label: translate("label.ok"),
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      setModal({
        title: translate("frontdesk.transaction.error.qr.title"),
        message: translate("frontdesk.transaction.error.qr.description"),
        buttons: [
          {
            label: translate("label.ok"),
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
    const days = Math.floor(hours / 24);

    if (minutes < 1) return translate("frontdesk.transaction.recent.time.justNow");
    if (minutes < 60) return `${minutes} ${translate(minutes === 1 ? "frontdesk.transaction.recent.time.minute" : "frontdesk.transaction.recent.time.minutes")}`;
    if (hours < 24) return `${hours} ${translate(hours === 1 ? "frontdesk.transaction.recent.time.hour" : "frontdesk.transaction.recent.time.hours")}`;
    return `${days} ${translate(days === 1 ? "frontdesk.transaction.recent.time.day" : "frontdesk.transaction.recent.time.days")}`;
  };

  const handleModalClose = () => {

    const amount = parseFloat(purchaseAmount);
    addScan({
      points: successPoints,
      timestamp: new Date(),
      amount: amount
    });


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
    <View className="flex-1 bg-background dark:bg-darkBackground">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <ScrollView className="flex-1 bg-background dark:bg-darkBackground" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-orange-500 pt-20 px-5 pb-10 rounded-b-xl">
          <View className="flex-row items-center justify-between">
            {/* <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity> */}
            <Text className="text-xl font-poppins-bold text-white">
              {translate("frontdesk.transaction.title")}
            </Text>
          </View>

          {/* Store Info */}
          {storeInfo && (
            <View className="bg-white/95 dark:bg-darkBackgroundMuted/50 p-5 rounded-xl mb-2 mt-3 items-center border border-white/20 dark:border-darkBorder/50">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-orange-500 rounded-xl items-center justify-center mr-4">
                  <MaterialIcons name="store" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-poppins-medium text-orange-600 dark:text-darkPrimaryText uppercase tracking-wider mb-1">
                    {translate("frontdesk.transaction.store")}
                  </Text>
                  <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                    {storeInfo.name}
                  </Text>
                </View>
              </View>
            </View>
          )}

        </View>

        {/* Scanner Card */}
        <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-4 -mt-8 border border-neutral-100 dark:border-darkBorder mx-5">
          {showCamera ? (
            <View className="bg-neutral-900 rounded-xl h-80 overflow-hidden border border-neutral-200 dark:border-darkBorder/50">
              {permission?.granted ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                >
                  <View className="absolute inset-0 bg-black/40" />

                  {/* Scanning Area Frame */}
                  <View className="absolute top-1/2 left-1/2 -mt-28 -ml-28 w-56 h-56 items-center justify-center">
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                    {/* Inner Guide */}
                    <View className="w-52 h-52 border border-white/20 rounded-xl" />
                  </View>
                </CameraView>
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-900 p-5">
                  <View className="w-16 h-16 bg-orange-500 rounded-2xl items-center justify-center mb-5">
                    <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
                  </View>
                  <Text className="text-base font-poppins-bold text-white mb-3">
                    {translate("frontdesk.transaction.camera.permission.title")}
                  </Text>
                  <Text className="text-sm font-poppins-medium text-gray-400 text-center mb-5">
                    {translate("frontdesk.transaction.camera.permission.description")}
                  </Text>
                  <Button
                    label={translate("label.allow")}
                    onPress={() => requestPermission()}
                    fullWidth
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1">
              {/* Amount Input Section */}
              <View className="bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl p-6 mb-4">
                <Text className="text-sm font-poppins-medium text-textSecondary dark:text-darkTextSecondary mb-3 text-center">
                  {translate("frontdesk.transaction.transactionModal.title")}
                </Text>
                <View className="flex-row items-center bg-white dark:bg-darkBackgroundCard border border-neutral-100 dark:border-darkBorder rounded-xl px-5 py-4">
                  <Text className="text-xl font-poppins-bold text-textSecondary dark:text-darkTextSecondary mr-2">₱</Text>
                  <TextInput
                    className="flex-1 text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary"
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
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    autoFocus
                    maxLength={7}
                  />
                </View>
              </View>

              {/* Carousel Container */}
              <View className="relative h-72 mb-4 overflow-hidden" style={{ marginLeft: -30, marginRight: -30 }}>
                <Animated.View
                  style={{
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, -(screenWidth - 60)],
                      }),
                    }],
                    flexDirection: 'row',
                    width: (screenWidth - 32) * 2,
                    height: 288,
                  }}
                >
                  {/* QR Scan Option */}
                  <View style={{ width: screenWidth - 60, height: 288, backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderRadius: 12, marginRight: 16 }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 20, paddingTop: 32 }}>
                      <View style={{ width: 64, height: 64, backgroundColor: isDark ? '#374151' : '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <MaterialIcons name="qr-code-scanner" size={32} color="#FF6600" />
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#F9FAFB' : '#111827', marginBottom: 6, textAlign: 'center' }}>QR Scan</Text>
                      <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                        Scan customer QR code
                      </Text>
                      <TouchableOpacity
                        onPress={handleStartScanning}
                        className="bg-orange-500 px-6 py-3 rounded-xl"
                      >
                        <Text className="text-white font-poppins-bold">Scan Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Manual Input Option */}
                  <View style={{ width: screenWidth - 60, height: 288, backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderRadius: 12, marginLeft: 16 }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 20, paddingTop: 32 }}>
                      <View style={{ width: 64, height: 64, backgroundColor: isDark ? '#374151' : '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <MaterialIcons name="keyboard" size={32} color="#FF6600" />
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#F9FAFB' : '#111827', marginBottom: 6, textAlign: 'center' }}>Manual Input</Text>
                      <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                        Enter code manually
                      </Text>
                      <TouchableOpacity
                        onPress={handleManualInputSubmit}
                        className="bg-orange-500 px-6 py-3 rounded-xl"
                      >
                        <Text className="text-white font-poppins-bold">Enter Code</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Carousel Indicators */}
              <View className="flex-row justify-center items-center mb-4">
                <TouchableOpacity onPress={switchToQR} className="mx-2">
                  <View className={`w-2 h-2 rounded-full ${inputMode === 'qr' ? 'bg-orange-500' : 'bg-neutral-300'}`} />
                </TouchableOpacity>
                <TouchableOpacity onPress={switchToManual} className="mx-2">
                  <View className={`w-2 h-2 rounded-full ${inputMode === 'manual' ? 'bg-orange-500' : 'bg-neutral-300'}`} />
                </TouchableOpacity>
              </View>

              {/* Voucher Code Input - Only show when manual mode is selected */}
              {inputMode === 'manual' && (
                <View className="bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl p-4 mb-4">
                  <Text className="text-sm font-poppins-medium text-textSecondary dark:text-darkTextSecondary mb-2">
                    Enter Voucher Code
                  </Text>
                  <View className="flex-row items-center bg-white dark:bg-darkBackgroundCard border border-neutral-100 dark:border-darkBorder rounded-xl px-5 py-4">
                    <MaterialIcons name="confirmation-number" size={20} color="#FF6600" className="mr-3" />
                    <TextInput
                      className="flex-1 text-base font-poppins-medium text-textPrimary dark:text-darkTextPrimary"
                      value={voucherCode}
                      onChangeText={setVoucherCode}
                      placeholder="Enter code"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      maxLength={20}
                    />
                  </View>
                </View>
              )}

              {/* Navigation Buttons */}
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={switchToQR}
                  className={`flex-1 mr-2 py-3 rounded-xl border ${
                    inputMode === 'qr'
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-white dark:bg-darkBackgroundCard border-neutral-200 dark:border-darkBorder'
                  }`}
                >
                  <Text className={`text-center font-poppins-medium ${
                    inputMode === 'qr' ? 'text-white' : 'text-textSecondary dark:text-darkTextSecondary'
                  }`}>
                    QR Scan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={switchToManual}
                  className={`flex-1 ml-2 py-3 rounded-xl border ${
                    inputMode === 'manual'
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-white dark:bg-darkBackgroundCard border-neutral-200 dark:border-darkBorder'
                  }`}
                >
                  <Text className={`text-center font-poppins-medium ${
                    inputMode === 'manual' ? 'text-white' : 'text-textSecondary dark:text-darkTextSecondary'
                  }`}>
                   Input Code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showCamera && (
            
            <View className="mt-5 relative">
              <View className="mt-6 relative">
                 <TouchableOpacity
                onPress={() => setShowCamera(false)}
                className="absolute -top-4 left-0 z-10 w-10 h-10 rounded-full items-center justify-center bg-white/90 dark:bg-darkBackgroundCard/90 border border-white/20 dark:border-darkBorder/50"
              >
                <MaterialIcons name="arrow-back" size={24} color="#FF6600" />
              </TouchableOpacity>  
              <View className="flex-row items-center justify-center">
                <View className="w-2 h-2 bg-emerald-500 rounded-full mr-3" />
                <Text className="text-sm font-poppins-medium text-textSecondary dark:text-darkTextSecondary">
                  {translate("frontdesk.transaction.camera.title")}
                </Text>
              </View>
              <Text className="text-xs font-poppins-medium text-neutral-400 dark:text-darkTextSoft text-center mt-3">
                {translate("frontdesk.transaction.camera.description")}
              </Text>
            </View>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View className="px-5 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">{translate("frontdesk.transaction.recent.title")}</Text>
            <TouchableOpacity>
              <Text className="text-sm font-poppins-medium text-orange-600">{translate("frontdesk.transaction.recent.view")}</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <View key={index} className="bg-white dark:bg-darkBackgroundCard p-4 rounded-xl border border-neutral-100 dark:border-darkBorder mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl items-center justify-center mr-4">
                      <MaterialIcons name="check" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        ₱{scan.amount.toFixed(2)} {translate("frontdesk.transaction.recent.purchase")}
                      </Text>
                      <Text className="text-xs font-poppins text-neutral-400 dark:text-darkTextSoft">{formatTimeAgo(scan.timestamp)}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-poppins-bold text-orange-500">+{scan.points} pts</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white dark:bg-darkBackgroundCard p-6 rounded-xl border border-neutral-100 dark:border-darkBorder">
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="history" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary ml-3">
                  {translate("frontdesk.transaction.recent.empty")}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title=""
        buttons={[
          {
            label: translate("frontdesk.transaction.success.scanAnother"),
            onPress: handleModalClose,
            variant: "primary"
          }
        ]}
      >
        {/* Success Icon */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl items-center justify-center">
            <MaterialIcons name="check" size={40} color="#10B981" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-poppins-bold text-center text-textPrimary dark:text-darkTextPrimary mb-2">
          {translate("frontdesk.transaction.success.title")}
        </Text>

        {/* Transaction ID */}
        {/* <Text className="text-base font-poppins-medium text-center text-gray-600 mb-6">
          Transaction ID: {successTransactionId}
        </Text> */}

        {/* Points Display */}
        <View className="bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl p-6 mb-8 border border-neutral-100 dark:border-darkBorder">
          <Text className="text-4xl font-poppins-bold text-center text-orange-600 dark:text-darkPrimaryText">
            +{successPoints}
          </Text>
          <Text className="text-sm font-poppins-medium text-center text-orange-500 dark:text-darkPrimarySecondary mt-1">
            {translate("frontdesk.transaction.success.pointsAwarded")}
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
            label: translate("label.tryAgain"),
            onPress: handleErrorModalClose,
            variant: "primary"
          }
        ]}
      >
        {/* Error Icon */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-xl items-center justify-center">
            <MaterialIcons name="error" size={40} color="#EF4444" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-2xl font-poppins-bold text-center text-textPrimary dark:text-darkTextPrimary mb-2">
          Error
        </Text>

        {/* Error Message */}
        <Text className="text-base font-poppins text-center text-textSecondary dark:text-darkTextSecondary mb-8 px-4">
          {errorMessage}
        </Text>
      </Modal>

    </View>
  );
}








