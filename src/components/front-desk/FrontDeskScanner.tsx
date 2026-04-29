import React, { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Alert, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import { Animated, Dimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import VoucherForm from "@/components/voucher/voucherForm";
import CompactAmountInput from "@/components/compact-amount-input";
import {FrontDeskScannerProps} from "@/type/frontdesk/scanner"; 

export default function FrontDeskScanner({
  purchaseAmount,
  setPurchaseAmount,
  showCamera,
  setShowCamera,
  scanned,
  isProcessing,
  onBarcodeScanned,
  modal,
  setModal,
  voucherCode,
  setVoucherCode,
  currentStaffId,
  onSuccess,
  onError,
  scrollY,
}: FrontDeskScannerProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const { t: translate } = useTranslation();
  const ColorScheme = useColorScheme();
  const isDark = ColorScheme === "dark";

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

  return (
    <View className="mx-4 mt-4 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden shadow-sm">
      {showCamera ? (
        <>
          <View className="bg-neutral-900 h-80 overflow-hidden">
            {permission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={scanned ? undefined : (result) => onBarcodeScanned(result.data)}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                enableTorch={false}
              >
                <View className="absolute inset-0 bg-black/40" />
                
                {/* Overlay Back Button */}
                <View className="absolute top-12 left-5 z-10 -mt-8">
                  <TouchableOpacity
                    onPress={() => setShowCamera(false)}
                    className="flex-row items-center"
                  >
                    <MaterialIcons name="arrow-back-ios" size={16} color="#FF6600" />
                    <Text className="text-sm font-poppins-medium text-orange-500 ml-1">
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>

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
            <View className="flex-row items-center justify-center">
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
          {/* Regular Amount Input */}
          <CompactAmountInput
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
            placeholder="0.00"
            autoFocus={true}
            isVisible={true}
            isFloating={false}
          />

          {/* Mode Toggle Pill */}
          <View className="flex-row bg-neutral-100 dark:bg-darkBackgroundMuted rounded-xl p-1 mb-5">
            <TouchableOpacity
              onPress={switchToQR}
              className="will-change-variable flex-1 py-2.5 rounded-lg items-center flex-row justify-center"
              style={inputMode === "qr"
                ? {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08, shadowRadius: 2, elevation: 2
                }
                : undefined}
            >
              <MaterialIcons
                name="qr-code-scanner"
                size={16}
                color={inputMode === "qr" ? "#FF6600" : (isDark ? "#6B7280" : "#9CA3AF")}
              />
              <Text
                className="will-change-variable ml-2 text-sm font-poppins-semibold"
                style={{ color: inputMode === "qr" ? "#FF6600" : (isDark ? "#6B7280" : "#9CA3AF") }}
              >
                QR Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={switchToManual}
              className="will-change-variable flex-1 py-2.5 rounded-lg items-center flex-row justify-center"
              style={inputMode === "manual"
                ? {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08, shadowRadius: 2, elevation: 2
                }
                : undefined}
            >
              <MaterialIcons
                name="confirmation-number"
                size={16}
                color={inputMode === "manual" ? "#FF6600" : (isDark ? "#6B7280" : "#9CA3AF")}
              />
              <Text
                className="will-change-variable ml-2 text-sm font-poppins-semibold"
                style={{ color: inputMode === "manual" ? "#FF6600" : (isDark ? "#6B7280" : "#9CA3AF") }}
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
                    outputRange: [0, -screenWidth],
                  }),
                }],
                flexDirection: "row",
                width: screenWidth * 2,
              }}
            >
              {/* QR Panel - Independent */}
              <View style={{ width: screenWidth }} className="pl-20">
                <View className="items-center justify-center" style={{ height: 260, paddingLeft: 20, paddingRight: 120 }}>
                  <View className="items-center -mt-4">
                    <View className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 rounded-3xl items-center justify-center mb-5 border">
                      <MaterialIcons name="qr-code-scanner" size={48} color="#FF6600" />
                    </View>
                    <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary mb-2 -mt-2">
                      Scan QR Code
                    </Text>
                    <Text className="text-sm font-poppins text-neutral-400 dark:text-darkTextSoft text-center mb-6">
                     Point the camera at the customer's QR
                    </Text>
                    <View className="-mt-1">
                    <Button
                      label="Open Camera"
                      onPress={handleStartScanning}
                      icon="Camera"
                    />
                    </View>
                  </View>
                </View>
              </View>

              {/* Manual Panel - Independent */}
              <View style={{ width: screenWidth }} className="pr-11">
               
                <View className="pt-23  items-center justify-center" style={{ height: 180, paddingLeft: 20, paddingRight: 20 }}>
                  <View className="items-center pl-2 ">
                    {/* Voucher icon row */}
                    <View className="pl-3">
                    <View className="w-15 h-15 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 rounded-xl items-center justify-center mr-3 border">
                        <MaterialIcons name="confirmation-number" size={40} color="#FF6600" />
                      </View>
                    </View>  
                    <View className="flex-row items-center mb-4 pt-15 -mt-12 pr-3">
                      <View>
                        <Text className="text-base font-poppins-bold text-neutral-900 dark:text-darkTextPrimary pl-15">
                          Enter Voucher Code
                        </Text>
                        <Text className="text-xs font-poppins text-neutral-400 text-center pl-2">
                          Type the code from the customer's voucher
                        </Text>
                      </View>
                    </View>

                    {/* Code input */}
                    <View className="w-72 pl-2 -mt-7">
                      <TextField
                        label=""
                        value={voucherCode}
                        onChangeText={setVoucherCode}
                        placeholder="e.g. VCH1R3"
                        sanitize={(v) => v.toUpperCase().slice(0, 20)}
                      />
                    </View>
                    <View className="pt-4 pl-2">
                    <VoucherForm
                      voucherCode={voucherCode}
                      amount={purchaseAmount}
                      storeStaffId={currentStaffId}
                      onSuccess={onSuccess}
                      onError={onError}
                    />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

        </View>
      )}
    </View>
  );
}
