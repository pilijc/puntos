import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  Easing,
  ScrollView,
  Dimensions,
  Modal as RNModal,
  useColorScheme,
} from "react-native";
import { View, Text, TouchableOpacity, Image } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Store } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { getQRCodeData } from "@/services/user/rewards-redemption";

const isWeb = Platform.OS === "web";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface RedemptionDrawerProps {
  visible: boolean;
  rewardTitle?: string;
  rewardDescription?: string;
  rewardImage?: string;
  redemptionCode?: { code: string; expires_at: string };
  timeRemaining?: number;
  status?: "loading" | "active" | "redeemed" | "cancelled" | "expired" | "error";
  onClose: () => void;
  onCancel?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RedemptionDrawer({
  visible,
  rewardTitle,
  rewardDescription,
  rewardImage,
  redemptionCode,
  timeRemaining = 1200,
  status = "active",
  onClose,
  onCancel,
}: RedemptionDrawerProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isExpiringSoon = (timeRemaining || 0) < 60;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Maintain internal visibility to allow closing animation before unmounting via Modal
  const [internalVisible, setInternalVisible] = useState(visible);

  const closeSheet = useCallback(
    (onClosed?: () => void) => {
      if (isWeb) {
        onClose();
        onClosed?.();
        return;
      }

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
        onClosed?.();
      });
    },
    [translateY, backdropOpacity, onClose]
  );

  const handleSwipeClose = useCallback(() => {
    if (status === "cancelled" || status === "redeemed") {
      closeSheet();
    } else {
      setShowConfirmModal(true);
    }
  }, [status, closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          handleSwipeClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 120,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleKeepIt = () => {
    setShowConfirmModal(false);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmCancel = async () => {
    setShowConfirmModal(false);
    if (onCancel) await onCancel();
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    closeSheet();
  };

  useEffect(() => {
    if (visible && !isWeb) {
      setInternalVisible(true);
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible) {
      // If visible prop becomes false from parent, we sync internal state
      setInternalVisible(false);
    }
  }, [visible]);

  if (!visible) return null;

  const formattedCode = redemptionCode?.code?.replace(/-/g, " ") || "";
  const handleCancelPress = () => setShowConfirmModal(true);

  return (
    <RNModal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() =>
        status === "cancelled" || status === "redeemed"
          ? closeSheet()
          : setShowConfirmModal(true)
      }
    >
      <View className="flex-1" style={{ justifyContent: "flex-end" }}>

        {/* Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
          className="bg-black/60"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() =>
              status === "cancelled" || status === "redeemed"
                ? closeSheet()
                : setShowConfirmModal(true)
            }
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View style={{ transform: [{ translateY }] }}>
          <View
            {...panResponder.panHandlers}
            className="bg-white rounded-t-[16px] overflow-hidden"
            style={{ maxHeight: SCREEN_HEIGHT * 0.73 }}
          >
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} scrollEnabled={false} contentContainerStyle={{ flexGrow: 1 }}>

              {/* CARD AREA BACKGROUND */}
              <View className="bg-primary pb-4">
                <View className="mb-4 items-center py-3 relative px-4 bg-[#FFFFFF] dark:bg-darkBackgroundCard border-b border-neutral-200">
                  <Text className="text-lg text-neutral-900 dark:text-white font-poppins-semibold">
                    {status === "redeemed" ? "Reward Redeemed" : "Scan to redeem"}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      status === "cancelled" || status === "redeemed"
                        ? closeSheet()
                        : setShowConfirmModal(true)
                    }
                    className="absolute right-6 top-3 p-1"
                  >
                    <X size={24} color={isDark ? "#fff" : "#1F2937"} />
                  </TouchableOpacity>
                </View>

                {/* COMBINED QR & REWARD CARD */}
                <View className="mx-4 mb-4 bg-white rounded-3xl p-3 pb-4 border border-neutral-100">

                  {/* covering QR & Timer */}
                  <View className="bg-[#F3F4F6] dark:bg-darkBackgroundCard rounded-2xl p-4 items-center mb-4">
                    {/* White box */}
                    <View className="bg-white dark:bg-neutral-800 py-3 px-4 rounded-xl mb-3 items-center shadow-sm shadow-black/5 self-center relative">
                      <View className="mb-2 items-center justify-center">
                        {status === "loading" ? (
                          <View className="w-[140px] h-[140px] items-center justify-center">
                            <Text className="text-neutral-400 text-xs font-poppins-medium">
                              Generating...
                            </Text>
                          </View>
                        ): status === "expired" || timeRemaining === 0 ? (
                          <View className="w-[140px] h-[140px] items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <Text className="text-red-500 text-sm font-poppins-bold text-center px-4"> 
                            Code Expired
                            </Text>
                          </View>
                        ) : (
                            <QRCode value={getQRCodeData(redemptionCode?.code || "")} size={140}/>
                        )}
                      </View>

                      <Text className="text-2xl font-poppins-bold tracking-[0.15em] text-neutral-900 dark:text-white">
                        {status === "loading" ? "..." : status === "expired" || timeRemaining === 0 ? "EXPIRED" : formattedCode}
                      </Text>

                      {/* Expired overlay */}
                      {(status === "expired" || timeRemaining === 0) && (
                        <View className="absolute inset-0 bg-black/50 rounded-xl items-center justify-center">
                          <X size={32} color="#EF4444" />
                        </View>
                      )}
                    </View>

                    <Text className="text-[11px] text-neutral-500 dark:text-neutral-400 font-poppins mt-1">Time left to redeem</Text>

                    <Text className={`text-2xl font-poppins-bold mt-1 ${isExpiringSoon ? "text-red-500" : "text-neutral-900 dark:text-white"}`}>
                      {status === "redeemed"
                        ? "Redeemed!"
                        : status === "loading"
                          ? "--:--"
                          : status === "expired" || timeRemaining === 0
                            ? "0:00"
                            : formatTime(timeRemaining)}
                    </Text>
                  </View>


                  {/* Reward Section (Image on right) */}
                  <View className="flex-row items-center justify-between pt-2">
                    <View className="flex-1 pr-4">
                      <Text numberOfLines={2} className="text-[14px] font-poppins-bold text-neutral-900 leading-tight">
                        {rewardTitle}
                      </Text>
                      {rewardDescription && (
                        <Text numberOfLines={2} className="text-[11px] text-neutral-500 font-poppins mt-1 leading-normal">
                          {rewardDescription}
                        </Text>
                      )}
                    </View>

                    <View className="w-20 h-20 shadow-sm shadow-black/10">
                      {rewardImage ? (
                        <Image
                          source={typeof rewardImage === "string" && rewardImage.startsWith("http") ? { uri: rewardImage } : rewardImage}
                          className="w-20 h-20 rounded-xl"
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-20 h-20 bg-orange-50 rounded-xl items-center justify-center border border-orange-100">
                          <Text className="text-3xl">🎁</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* INSTRUCTIONS */}
              <View className="flex-1  px-4 pb-6 bg-backgroundMuted dark:bg-darkBackgroundMuted">
                <View className="mt-4 min-h-[450px] bg-[rgba(255,102,0,0.07)] p-4 rounded-2xl justify-start">
                  <Text className="text-[10px] text-neutral-400 font-poppins-bold mb-4 uppercase tracking-[2px]">
                    How to redeem
                  </Text>

                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-white dark:bg-darkBackgroundCard rounded-xl items-center justify-center shadow-sm mr-4">
                      <Store size={20} color="#FF6600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-poppins-bold text-neutral-900">
                        In the restaurant
                      </Text>
                      <Text className="text-xs text-neutral-500 font-poppins mt-0.5">
                        Scan or show code to staff
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Spacer for bottom safe area if needed */}
                <View style={{ height: insets.bottom + 20 }} />
              </View>

            </ScrollView>
          </View>
        </Animated.View>

        {/* MODALS */}
        <Modal
          visible={showConfirmModal}
          onClose={handleKeepIt}
          title="Cancel Redemption?"
          message="Are you sure you want to cancel this redemption? Points will be returned to your balance."
          buttons={[
            { label: "Keep it", onPress: handleKeepIt, variant: "secondary" },
            { label: "Cancel", onPress: handleConfirmCancel, variant: "danger" },
          ]}
        />

        <Modal
          visible={showSuccessModal}
          onClose={handleSuccessClose}
          title="Cancelled"
          message="Your code is cancelled."
          buttons={[
            { label: "Got it", onPress: handleSuccessClose, variant: "primary" },
          ]}
        />
      </View>
    </RNModal>
  );
}