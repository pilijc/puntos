import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, useColorScheme } from "react-native";
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput } from "@/tw";
import { Animated, Dimensions, StatusBar } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { processFrontDeskScan, getCurrentUserStore } from "@/services/frontdesk/scan-service";
import { getCurrentStaffId } from "@/services/frontdesk/voucher-service";
import { supabase } from "@/supabase/supabase";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { useTranslation } from "react-i18next";
import VoucherForm from "@/components/voucher/voucherForm";
import { checkPasswordSetupRequired } from "@/services/frontdesk/password-service";

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
  const [isPasswordSetupComplete, setIsPasswordSetupComplete] = useState<boolean | null>(null);
  const [passwordSetupModal, setPasswordSetupModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
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
  const [currentStaffId, setCurrentStaffId] = useState<string>("");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  const loadStoreInfo = useCallback(async () => {
    try {
      const staffId = await getCurrentStaffId();
      if (!staffId) return;
      setCurrentStaffId(staffId);
      const info = await getCurrentUserStore();
      setStoreInfo(info);
      if (info) fetchTransactions(info.id);
    } catch (err) {
      
    }
  }, [fetchTransactions]);

  useEffect(() => {
    loadStoreInfo();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        loadStoreInfo();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check password setup status
  useFocusEffect(
    useCallback(() => {
      const checkPasswordSetup = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const requiresPasswordSetup = await checkPasswordSetupRequired(user.id);
            const isComplete = !requiresPasswordSetup;
            setIsPasswordSetupComplete(isComplete);
            
            if (requiresPasswordSetup) {
              setPasswordSetupModal({
                title: "Password Setup Required",
                message: "Complete your password setup to access all dashboard features and ensure proper account security.",
                buttons: [{
                  label: "Set Password",
                  variant: "primary",
                  onPress: () => {
                    setPasswordSetupModal(null);
                    router.replace("/(front_desk)/setup-password");
                  }
                }]
              });
            }
          }
        } catch (error) {
           setIsPasswordSetupComplete(false);
        }
      };
      
      checkPasswordSetup();
    }, [router])
  );

  const handleStartScanning = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setModal({
        title: translate("frontdesk.transaction.error.amount.invalid"),
        message: translate("frontdesk.transaction.error.amount.lessThanZero"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const switchToQR = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
    setInputMode("qr");
  };

  const switchToManual = () => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
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
        const pointsAwarded = result.pointsEarned || Math.ceil(amount * 0.1);
        setSuccessTransactionId(result.transactionId || "");
        setSuccessPoints(pointsAwarded);
        setShowSuccessModal(true);
      } else {
        setModal({
          title: translate("frontdesk.transaction.error.qr.title"),
          message: result.message || translate("frontdesk.transaction.error.qr.description"),
          buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
        });
      }
    } catch (error) {
      setModal({
        title: translate("frontdesk.transaction.error.qr.title"),
        message: translate("label.somethingWentWrong"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
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
    if (minutes < 60) return `${minutes}${translate(minutes === 1 ? "frontdesk.transaction.recent.time.minute" : "frontdesk.transaction.recent.time.minutes")} ago`;
    if (hours < 24) return `${hours}${translate(hours === 1 ? "frontdesk.transaction.recent.time.hour" : "frontdesk.transaction.recent.time.hours")} ago`;
    return `${days}${translate(days === 1 ? "frontdesk.transaction.recent.time.day" : "frontdesk.transaction.recent.time.days")} ago`;
  };

  const handleModalClose = () => {
    setScanned(false);
    setIsProcessing(false);
    setShowCamera(false);
    setPurchaseAmount("");
    setVoucherCode("");
    setShowSuccessModal(false);
  };

  const handleErrorModalClose = () => {
    setScanned(false);
    setIsProcessing(false);
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-darkBackground">
      {/* Password Setup Modal */}
      <Modal
        visible={!!passwordSetupModal}
        onClose={() => {}}
        title={passwordSetupModal?.title ?? ""}
        message={passwordSetupModal?.message}
        buttons={passwordSetupModal?.buttons}
        showCloseButton={false}
        dismissOnBackdrop={false}
      />

      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Clean Header ── */}
        <View className="bg-white dark:bg-darkBackgroundCard px-5 pt-16 pb-5 border-b border-neutral-100 dark:border-darkBorder">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-xs font-poppins-medium text-neutral-400 dark:text-darkTextSoft uppercase tracking-widest mb-1">
                Front Desk
              </Text>
              <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                {translate("frontdesk.transaction.title")}
              </Text>
            </View>
          </View>

          {/* Store Chip */}
          {storeInfo && (
            <View className="flex-row items-center px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-darkBorder">
              <View className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-lg items-center justify-center mr-3">
                <MaterialIcons name="store" size={16} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-poppins-semibold text-primary uppercase tracking-wide">
                  {translate("frontdesk.transaction.store")}
                </Text>
                <Text className="text-sm font-poppins-bold text-neutral-700 dark:text-darkTextSoft">
                  {storeInfo.name}
                </Text>
              </View>
              <View className="w-2 h-2 bg-emerald-400 rounded-full" />
            </View>
          )}
        </View>

        {/* ── Main Scanner Card ── */}
        <View className="mx-4 mt-4 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden shadow-sm">

          {showCamera ? (
            <>
              <View className="bg-neutral-900 h-80 overflow-hidden">
                {permission?.granted ? (
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    enableTorch={false}
                  >
                    <View className="absolute inset-0 bg-black/40" />
                    {/* Corner guides */}
                    <View className="absolute top-1/2 left-1/2 -mt-28 -ml-28 w-56 h-56">
                      <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-xl" />
                      <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-xl" />
                      <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-xl" />
                      <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-xl" />
                    </View>
                  </CameraView>
                ) : (
                  <View className="flex-1 items-center justify-center bg-neutral-900 p-6">
                    <View className="w-16 h-16 bg-orange-500 rounded-2xl items-center justify-center mb-4">
                      <MaterialIcons name="camera-alt" size={32} color="#fff" />
                    </View>
                    <Text className="text-base font-poppins-bold text-white mb-2">
                      {translate("frontdesk.transaction.camera.permission.title")}
                    </Text>
                    <Text className="text-sm font-poppins text-neutral-400 text-center mb-5">
                      {translate("frontdesk.transaction.camera.permission.description")}
                    </Text>
                    <Button label={translate("label.allow")} onPress={() => requestPermission()} fullWidth />
                  </View>
                )}
              </View>

              {/* Camera footer */}
              <View className="px-5 py-4">
                <TouchableOpacity
                  onPress={() => setShowCamera(false)}
                  className="flex-row items-center"
                >
                  <MaterialIcons name="arrow-back-ios" size={16} color="#FF6600" />
                  <Text className="text-sm font-poppins-medium text-orange-500 ml-1">
                    Back
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center justify-center mt-3">
                  <View className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                  <Text className="text-sm font-poppins-medium text-neutral-500 dark:text-darkTextSecondary">
                    {translate("frontdesk.transaction.camera.title")}
                  </Text>
                </View>
                <Text className="text-xs font-poppins text-neutral-400 text-center mt-1">
                  {translate("frontdesk.transaction.camera.description")}
                </Text>
              </View>
            </>
          ) : (
            <View className="p-5">

              {/* Amount Input */}
              <View className="mb-5">
                <Text className="text-xs font-poppins-semibold text-neutral-400 dark:text-darkTextSoft uppercase tracking-widest mb-2">
                  {translate("frontdesk.transaction.transactionModal.title")}
                </Text>
                <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-4">
                  <Text className="text-2xl font-poppins-bold text-orange-500 mr-2">₱</Text>
                  <TextInput
                    className="flex-1 text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary"
                    value={purchaseAmount}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9.]/g, "");
                      const parts = numericText.split(".");
                      const filteredText = parts.length > 2
                        ? parts[0] + "." + parts.slice(1).join("")
                        : numericText;
                      setPurchaseAmount(filteredText);
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="numeric"
                    autoFocus
                    maxLength={7}
                  />
                </View>
              </View>

              {/* Mode Toggle Pill */}
              {/* NOTE: will-change-variable suppresses the ReactNativeCss remount warning
                  caused by toggling className variables at runtime. */}
              <View className="flex-row bg-neutral-100 dark:bg-darkBackgroundMuted rounded-xl p-1 mb-5">
                <TouchableOpacity
                  onPress={switchToQR}
                  className="will-change-variable flex-1 py-2.5 rounded-lg items-center flex-row justify-center"
                  style={inputMode === "qr"
                    ? { backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 }
                    : undefined}
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={16}
                    color={inputMode === "qr" ? "#FF6600" : isDark ? "#6B7280" : "#9CA3AF"}
                  />
                  <Text
                    className="will-change-variable ml-2 text-sm font-poppins-semibold"
                    style={{ color: inputMode === "qr" ? "#FF6600" : isDark ? "#6B7280" : "#9CA3AF" }}
                  >
                    QR Scan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={switchToManual}
                  className="will-change-variable flex-1 py-2.5 rounded-lg items-center flex-row justify-center"
                  style={inputMode === "manual"
                    ? { backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 }
                    : undefined}
                >
                  <MaterialIcons
                    name="confirmation-number"
                    size={16}
                    color={inputMode === "manual" ? "#FF6600" : isDark ? "#6B7280" : "#9CA3AF"}
                  />
                  <Text
                    className="will-change-variable ml-2 text-sm font-poppins-semibold"
                    style={{ color: inputMode === "manual" ? "#FF6600" : isDark ? "#6B7280" : "#9CA3AF" }}
                  >
                    Input Code
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Carousel */}
              <View
                className="overflow-hidden"
                style={{ height: 260, marginHorizontal: -20 }}
              >
                <Animated.View
                  style={{
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, -(screenWidth - 48)],
                      }),
                    }],
                    flexDirection: "row",
                    width: (screenWidth - 32) * 2,
                  }}
                >
                  {/* QR Panel */}
                  <View style={{ width: screenWidth - 48, paddingHorizontal: 20 }}>
                    <View className="items-center py-6">
                      {/* Decorative QR illustration */}
                      <View className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-3xl items-center justify-center mb-5 border border-orange-100 dark:border-orange-500/20">
                        <MaterialIcons name="qr-code-scanner" size={48} color="#FF6600" />
                      </View>
                      <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary mb-2">
                        Scan QR Code
                      </Text>
                      <Text className="text-sm font-poppins text-neutral-400 dark:text-darkTextSoft text-center mb-6 px-4">
                        Point the camera at the customer's QR code to award points instantly
                      </Text>
                      <TouchableOpacity
                        onPress={handleStartScanning}
                        className="bg-orange-500 px-8 py-3.5 rounded-xl flex-row items-center"
                        style={{
                          shadowColor: "#FF6600",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.25,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <MaterialIcons name="qr-code-scanner" size={18} color="#fff" />
                        <Text className="text-base font-poppins-bold text-white ml-2">
                          Open Camera
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Manual Panel */}
                  <View style={{ width: screenWidth - 48, paddingHorizontal: 20 }}>
                    <View className="py-2">
                      {/* Voucher icon row */}
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl items-center justify-center mr-3 border border-orange-100 dark:border-orange-500/20">
                          <MaterialIcons name="confirmation-number" size={20} color="#FF6600" />
                        </View>
                        <View>
                          <Text className="text-base font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                            Enter Voucher Code
                          </Text>
                          <Text className="text-xs font-poppins text-neutral-400">
                            Type the code from the customer's voucher
                          </Text>
                        </View>
                      </View>

                      {/* Code input */}
                      <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-3.5 mb-4">
                        <TextInput
                          className="flex-1 text-base font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary tracking-widest"
                          value={voucherCode}
                          onChangeText={setVoucherCode}
                          placeholder="e.g. VCHR-1234"
                          placeholderTextColor="#D1D5DB"
                          autoCapitalize="characters"
                          maxLength={20}
                        />
                        {voucherCode.length > 0 && (
                          <TouchableOpacity onPress={() => setVoucherCode("")}>
                            <MaterialIcons name="close" size={18} color="#9CA3AF" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <VoucherForm
                        voucherCode={voucherCode}
                        amount={purchaseAmount}
                        storeStaffId={currentStaffId}
                        onSuccess={(points) => {
                          setSuccessPoints(points);
                          setShowSuccessModal(true);
                          addScan({ points, timestamp: new Date(), amount: parseFloat(purchaseAmount) });
                          setVoucherCode("");
                          setPurchaseAmount("");
                        }}
                        onError={(message) => {
                          setModal({
                            title: "Error",
                            message,
                            buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
                          });
                        }}
                      />
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Dot indicators */}
              <View className="flex-row justify-center mt-4 gap-x-2">
                <TouchableOpacity onPress={switchToQR}>
                  <View
                    className={`rounded-full ${inputMode === "qr" ? "bg-orange-500 w-5 h-2" : "bg-neutral-200 dark:bg-neutral-700 w-2 h-2"}`}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={switchToManual}>
                  <View
                    className={`rounded-full ${inputMode === "manual" ? "bg-orange-500 w-5 h-2" : "bg-neutral-200 dark:bg-neutral-700 w-2 h-2"}`}
                  />
                </TouchableOpacity>
              </View>

            </View>
          )}
        </View>

        {/* ── Recent Transactions ── */}
        <View className="px-4 pt-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-1 h-5 bg-orange-500 rounded-full mr-3" />
              <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                {translate("frontdesk.transaction.recent.title")}
              </Text>
            </View>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-sm font-poppins-medium text-orange-500 mr-1">
                {translate("frontdesk.transaction.recent.view")}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#FF6600" />
            </TouchableOpacity>
          </View>

          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <View
                key={index}
                className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder mb-3 overflow-hidden"
              >
                <View className="flex-row items-center px-4 py-4">
                  {/* Left accent bar */}
                  <View className="w-1 h-10 bg-emerald-400 rounded-full mr-4" />
                  <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl items-center justify-center mr-3">
                    <MaterialIcons name="check" size={18} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                      ₱{scan.amount.toFixed(2)} {translate("frontdesk.transaction.recent.purchase")}
                    </Text>
                    <Text className="text-xs font-poppins text-neutral-400 dark:text-darkTextSoft mt-0.5">
                      {formatTimeAgo(scan.timestamp)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-poppins-bold text-orange-500">
                      +{scan.points}
                    </Text>
                    <Text className="text-xs font-poppins text-neutral-400">pts</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder px-6 py-10 items-center">
              <View className="w-14 h-14 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-2xl items-center justify-center mb-3">
                <MaterialIcons name="history" size={26} color={isDark ? "#4B5563" : "#D1D5DB"} />
              </View>
              <Text className="text-sm font-poppins-medium text-neutral-400 dark:text-darkTextSoft text-center">
                {translate("frontdesk.transaction.recent.empty")}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title=""
        buttons={[{
          label: translate("frontdesk.transaction.success.scanAnother"),
          onPress: handleModalClose,
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

      {/* ── Error Modal ── */}
      <Modal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        title=""
        buttons={[{
          label: translate("label.tryAgain"),
          onPress: handleErrorModalClose,
          variant: "primary",
        }]}
      >
        <View className="items-center mb-5">
          <View className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl items-center justify-center border border-red-100 dark:border-red-500/20">
            <MaterialIcons name="error-outline" size={44} color="#EF4444" />
          </View>
        </View>
        <Text className="text-2xl font-poppins-bold text-center text-neutral-900 dark:text-darkTextPrimary mb-2">
          Something went wrong
        </Text>
        <Text className="text-sm font-poppins text-center text-neutral-500 dark:text-darkTextSecondary mb-6 px-4">
          {errorMessage}
        </Text>
      </Modal>
    </View>
  );
}