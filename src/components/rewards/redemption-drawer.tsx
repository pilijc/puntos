import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  Image,
  Easing,
  ScrollView,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Store, Speaker } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";

const isWeb = Platform.OS === "web";

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
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isExpiringSoon = (timeRemaining || 0) < 60;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const closeSheet = useCallback(
    (onClosed?: () => void) => {
      if (isWeb) {
        onClose();
        onClosed?.();
        return;
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 600,
          damping: 15,
          stiffness: 100,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        requestAnimationFrame(() => {
          onClose();
          onClosed?.();
        });
      });
    },
    [translateY, backdropOpacity, onClose]
  );

  const handleSwipeClose = useCallback(() => {
    if (status === "cancelled") {
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
        if (g.dy > 100) {
          handleSwipeClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 100,
            mass: 0.8,
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
      damping: 18,
      stiffness: 100,
      mass: 0.8,
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
      translateY.setValue(600);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !redemptionCode) return null;

  const formattedCode = redemptionCode.code
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/([a-zA-Z])(\d)/, "$1 $2")
    .replace(/(\d{3})(\d{3})/, "$1 $2");

  const handleCancelPress = () => setShowConfirmModal(true);

  return (
    <View className="absolute inset-0 z-50" style={{ justifyContent: "flex-end" }}>
      
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
        className="bg-black/40"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() =>
            status === "cancelled"
              ? closeSheet()
              : setShowConfirmModal(true)
          }
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View
          {...panResponder.panHandlers}
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{ maxHeight: "92%" }}
        >
          <View>
            
            {/* HEADER */}
            <View style={{ backgroundColor: "#FF6600" }}>
              <View className="w-12 h-1.5 bg-white/50 rounded-full self-center mt-3 mb-2" />

              <View className="items-center py-3 relative px-4">
                <Text className="text-base text-white font-poppins-semibold">
                  Scan to redeem
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    status === "cancelled"
                      ? closeSheet()
                      : setShowConfirmModal(true)
                  }
                  className="absolute right-4 top-2 p-1"
                >
                  <X size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* QR CARD */}
              <View className="mx-3 mb-3 bg-white rounded-2xl p-4 items-center shadow-lg">
                
                <View className="bg-white p-2 rounded-xl mb-3 border border-neutral-100">
                  {status === "loading" ? (
                    <View className="w-[140px] h-[140px] items-center justify-center">
                      <Text className="text-neutral-400 text-xs font-poppins-medium">
                        Generating...
                      </Text>
                    </View>
                  ) : (
                    <QRCode value={redemptionCode.code} size={140} />
                  )}
                </View>

                <Text className="text-xl font-poppins-bold mb-1 tracking-[0.15em] text-neutral-900">
                  {status === "loading" ? "..." : formattedCode}
                </Text>

                <Text className="text-xs text-neutral-500 font-poppins-medium">Time left to redeem</Text>

                <Text className={`text-2xl font-poppins-bold mt-1 ${isExpiringSoon ? "text-red-500" : "text-neutral-900"}`}>
                  {status === "loading"
                    ? "--:--"
                    : formatTime(timeRemaining)}
                </Text>
              </View>

              {/* REWARD */}
              <View className="mx-3 mb-3 bg-white rounded-xl p-3 flex-row items-center shadow-md">
                <View className="flex-1 pr-4">
                  <Text numberOfLines={2} className="text-sm font-poppins-semibold text-neutral-900 leading-snug">
                    {rewardTitle}
                  </Text>
                  {rewardDescription && (
                    <Text numberOfLines={2} className="text-xs text-neutral-600 font-poppins-medium mt-1 leading-relaxed">
                      {rewardDescription}
                    </Text>
                  )}
                </View>

                <View className="w-28 h-28">
                  {rewardImage ? (
                    <Image
                      source={{ uri: rewardImage }}
                      className="w-28 h-28 rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-28 h-28 bg-orange-100 rounded-xl items-center justify-center border-2 border-orange-300">
                      <Text className="text-4xl">🎁</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* INSTRUCTIONS */}
            <View className="px-3 pb-4" style={{ backgroundColor: "#FF6600" }}>
              <View className="bg-neutral-100 p-4 rounded-2xl">
                <Text className="text-xs text-neutral-500 font-poppins-medium mb-3 uppercase tracking-wide">
                  How to redeem
                </Text>

                <View className="flex-row items-start mb-3">
                  <View className="w-8 h-8 bg-white rounded-lg items-center justify-center shadow-sm mr-3">
                    <Store size={16} color="#1f2937" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-sm font-poppins-semibold text-neutral-900">
                      In the restaurant
                    </Text>
                    <Text className="text-xs text-neutral-600 leading-relaxed">
                      Scan or show code to staff
                    </Text>
                  </View>
                </View>
              </View>

              {status !== "cancelled" && status !== "loading" && (
                <View className="mt-7">
                  <Button
                    label="Cancel Redemption"
                    onPress={handleCancelPress}
                    variant="danger"
                    fullWidth
                  />
                </View>
              )}
            </View>

          </View>
        </View>
      </Animated.View>

      {/* MODALS */}
      <Modal
        visible={showConfirmModal}
        onClose={handleKeepIt}
        title="Cancel Redemption?"
        message="Are you sure you want to cancel this redemption?"
        buttons={[
          { label: "Keep", onPress: handleKeepIt, variant: "secondary" },
          { label: "Cancel", onPress: handleConfirmCancel, variant: "danger" },
        ]}
      />

      <Modal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Cancelled"
        message="Redemption cancelled"
        buttons={[
          { label: "Close", onPress: handleSuccessClose, variant: "primary" },
        ]}
      />
    </View>
  );
}