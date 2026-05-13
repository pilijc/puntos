import React, { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Alert, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import { Animated, Dimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions, scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { verifyRedemptionCode, parseRedemptionQR } from "@/services/frontdesk/reward-redemption-service";
import { RedemptionVerificationResult } from "@/type/frontdesk/reward-redemption";

interface Props {
  currentStaffId: string;
  onSuccess: (result: RedemptionVerificationResult) => void;
  onError: (message: string) => void;
  scrollY: Animated.Value;
}

export default function RewardRedemptionScanner({
  currentStaffId,
  onSuccess,
  onError,
  scrollY,
}: Props) {
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [voucherCode, setVoucherCode] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const { t: translate } = useTranslation();
  const ColorScheme = useColorScheme();
  const isDark = ColorScheme === "dark";

  const handleStartScanning = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const scanResult = await scanFromURLAsync(uri, ["qr"]);
        if (scanResult && scanResult.length > 0) {
          handleBarcodeScanned(scanResult[0].data);
        } else {
          onError(translate("frontdesk.transaction.error.noQrDetected"));
        }
      }
    } catch (error) {
      onError(translate("frontdesk.transaction.error.failedProcessImage"));
    }
  };

  const handleBarcodeScanned = async (data: string) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      const parsedCode = parseRedemptionQR(data);
      const codeToVerify = parsedCode || voucherCode.trim();
      
      if (!codeToVerify) {
        onError(translate("frontdesk.transaction.redemption.error.invalidCode"));
        return;
      }

      const result = await verifyRedemptionCode(codeToVerify, currentStaffId);
      
      if (result.success) {
        onSuccess(result);
        setShowCamera(false);
        setVoucherCode("");
      } else {
        onError(result.message || translate("frontdesk.transaction.redemption.error.invalidCode"));
      }
    } catch (error) {
      onError(translate("label.somethingWentWrong"));
    } finally {
      setScanned(false);
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!voucherCode.trim()) {
      onError(translate("frontdesk.transaction.redemption.error.enterCode"));
      return;
    }

    handleBarcodeScanned(voucherCode);
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
                onBarcodeScanned={scanned ? undefined : (result) => handleBarcodeScanned(result.data)}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                enableTorch={false}
              >
                <View className="absolute inset-0 bg-black/40" />
                
                <View className="absolute top-12 left-5 z-10 -mt-8">
                  <TouchableOpacity
                    onPress={() => setShowCamera(false)}
                    className="flex-row items-center"
                  >
                    <MaterialIcons name="arrow-back-ios" size={16} color="#FF6600" />
                    <Text className="text-sm font-poppins-medium text-orange-500 ml-1">
                      {translate("label.back")}
                    </Text>
                  </TouchableOpacity>
                </View>

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
                  {translate("frontdesk.transaction.redemption.camera.permissionTitle")}
                </Text>
                <Text className="text-sm font-poppins text-neutral-400 text-center mb-5">
                  {translate("frontdesk.transaction.redemption.camera.permissionDescription")}
                </Text>
                <Button label={translate("frontdesk.transaction.redemption.camera.allowButton")} onPress={() => requestPermission()} fullWidth />
              </View>
            )}
          </View>

          <View className="px-5 py-4">
            <View className="flex-row items-center justify-center">
              <View className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
              <Text className="text-sm font-poppins-medium text-neutral-500 dark:text-darkTextSecondary">
                {translate("frontdesk.transaction.redemption.camera.scanning")}
              </Text>
            </View>
            <Text className="text-xs font-poppins text-neutral-400 text-center mt-1">
              {translate("frontdesk.transaction.redemption.camera.instruction")}
            </Text>
          </View>
        </>
      ) : (
        <View className="p-5">
          {/* Mode Toggle */}
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
                {translate("frontdesk.transaction.redemption.mode.qr")}
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
                {translate("frontdesk.transaction.redemption.mode.manual")}
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
              {/* QR Panel */}
              <View style={{ width: screenWidth }} className="pl-20">
                <View className="items-center justify-center" style={{ height: 260, paddingLeft: 20, paddingRight: 120 }}>
                  <View className="items-center -mt-4">
                    <View className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 rounded-3xl items-center justify-center mb-5 border">
                      <MaterialIcons name="qr-code-scanner" size={48} color="#FF6600" />
                    </View>
                    <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary mb-2 -mt-2">
                      {translate("frontdesk.transaction.redemption.qr.title")}
                    </Text>
                    <Text className="text-sm font-poppins text-neutral-400 dark:text-darkTextSoft text-center mb-6">
                      {translate("frontdesk.transaction.redemption.qr.description")}
                    </Text>
                    <View className="-mt-1 flex-row gap-x-2 items-center justify-center">
                      <Button
                        label={translate("frontdesk.transaction.redemption.qr.button")}
                        onPress={handleStartScanning}
                        icon="Camera"
                        fitContent
                      />
                      <TouchableOpacity
                        onPress={handleImagePicker}
                        className="bg-white dark:bg-darkBackgroundCard border border-orange-500 rounded-xl px-3 py-[9px] flex-row items-center justify-center"
                      >
                        <MaterialIcons name="image" size={16} color="#FF6600" />
                        <Text className="text-orange-500 font-poppins-semibold text-sm ml-1.5">{translate("frontdesk.transaction.buttons.upload")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Manual Panel */}
              <View style={{ width: screenWidth }} className="pr-11">
                <View className="pt-23 items-center justify-center" style={{ height: 180, paddingLeft: 20, paddingRight: 20 }}>
                  <View className="items-center pl-2">
                    <View className="pl-3">
                      <View className="w-15 h-15 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 rounded-xl items-center justify-center mr-3 border">
                        <MaterialIcons name="confirmation-number" size={40} color="#FF6600" />
                      </View>
                    </View>
                    <View className="flex-row items-center mb-4 pt-15 -mt-12 pr-3">
                      <View>
                        <Text className="text-base font-poppins-bold text-neutral-900 dark:text-darkTextPrimary pl-15">
                          {translate("frontdesk.transaction.redemption.manual.title")}
                        </Text>
                        <Text className="text-xs font-poppins text-neutral-400 text-center pl-2">
                          {translate("frontdesk.transaction.redemption.manual.description")}
                        </Text>
                      </View>
                    </View>

                    <View className="w-72 pl-2 -mt-7">
                      <TextField
                        label=""
                        value={voucherCode}
                        onChangeText={setVoucherCode}
                        placeholder={translate("frontdesk.transaction.redemption.manual.placeholder")}
                        sanitize={(v) => v.toUpperCase().slice(0, 10)}
                      />
                    </View>
                    <View className="pt-4 pl-2">
                      <Button
                        label={isProcessing ? translate("frontdesk.transaction.redemption.manual.verifying") : translate("frontdesk.transaction.redemption.manual.verifyButton")}
                        onPress={handleManualSubmit}
                        loading={isProcessing}
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
