import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Share2, X, Clock, CheckCircle } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { getQRCodeData } from "@/services/user/rewards-redemption";
import { useRedemptionCode } from "@/hooks/useRedemptionCode";

const REDIRECT_DELAY = {
  REDEEMED: 2000,
  CANCELLED: 1500,
  EXPIRED: 2000,
} as const;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function LoadingState() {
  return (
    <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
      <Text className="text-neutral-500 dark:text-neutral-400">Generating code...</Text>
    </View>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center px-6">
      <Text className="text-red-500 font-poppins-bold text-lg mb-2">
        Failed to generate code
      </Text>
      {message && (
        <Text className="text-neutral-500 dark:text-neutral-400 text-center text-sm">
          {message}
        </Text>
      )}
    </View>
  );
}

function SuccessState() {
  return (
    <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
      <Animated.View entering={FadeIn} className="items-center">
        <CheckCircle size={64} color="#10B981" />
        <Text className="text-green-600 font-poppins-bold text-lg mt-4">
          Successfully Redeemed!
        </Text>
      </Animated.View>
    </View>
  );
}

function CancelledState() {
  return (
    <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
      <Animated.View entering={FadeIn} className="items-center">
        <View className="w-24 h-24 items-center justify-center pl-13">
          <X size={64} color="#EF4444" />
        </View>
        <Text className="text-red-500 font-poppins-bold text-lg mt-4">Code Cancelled</Text>
      </Animated.View>
    </View>
  );
}

interface ActiveStateProps {
  rewardTitle?: string;
  rewardDescription?: string;
  redemptionCode: { code: string; expires_at: string };
  timeRemaining: number;
  onShare: () => void;
  onCancel: () => void;
  onBack: () => void;
  insets: { top: number };
}

function ActiveState({
  rewardTitle,
  rewardDescription,
  redemptionCode,
  timeRemaining,
  onShare,
  onCancel,
  onBack,
  insets,
}: ActiveStateProps) {
  const isExpiringSoon = timeRemaining < 60;

  return (
    <View className="flex-1 bg-white dark:bg-darkBackground">
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
          >
            <ChevronLeft size={20} color="#FF6600" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
          >
            <Share2 size={20} color="#FF6600" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6">
        <View className="items-center mb-8">
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white mb-2">
            {rewardTitle}
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-center">
            {rewardDescription}
          </Text>
        </View>

        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 drop-shadow-sm mb-6">
          <View className="items-center">
            <QRCode
              value={getQRCodeData(redemptionCode.code)}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
        </View>

        <View className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 mb-6">
          <Text className="text-center text-neutral-600 dark:text-neutral-400 mb-2 font-poppins-medium">
            Voucher Code
          </Text>
          <Text className="text-center text-3xl font-poppins-bold text-orange-600 dark:text-orange-400">
            {redemptionCode.code}
          </Text>
        </View>

        <View className="flex-row items-center justify-center mb-8">
          <Clock size={16} color={isExpiringSoon ? "#EF4444" : "#6B7280"} />
          <Text
            className={`ml-2 font-poppins-medium ${
              isExpiringSoon
                ? "text-red-500"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            Expires in {formatTime(timeRemaining)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onCancel}
          className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 items-center"
        >
          <Text className="text-red-600 dark:text-red-400 font-poppins-semibold">
            Cancel Redemption
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RedemptionCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rewardId, storeId, rewardTitle, rewardDescription } =
    useLocalSearchParams<{
      rewardId?: string;
      storeId?: string;
      rewardTitle?: string;
      rewardDescription?: string;
    }>();

  const {
    redemptionCode,
    status,
    errorMessage,
    timeRemaining,
    generateCode,
    cancelCode,
  } = useRedemptionCode(rewardId, storeId);


  useEffect(() => {
    if (!rewardId || !storeId) {
      router.back();
      return;
    }
    generateCode();
  }, [rewardId, storeId, router, generateCode]);

  // Handle auto-redirect on terminal states
  useEffect(() => {
    if (status === "redeemed") {
      setTimeout(() => router.back(), REDIRECT_DELAY.REDEEMED);
    } else if (status === "cancelled") {
      setTimeout(() => router.back(), REDIRECT_DELAY.CANCELLED);
    } else if (status === "expired") {
      setTimeout(() => router.back(), REDIRECT_DELAY.EXPIRED);
    }
  }, [status, router]);

  const handleShare = async () => {
    if (!redemptionCode) return;
    try {
      await Share.share({
        message: `Redemption Code: ${redemptionCode.code}`,
      });
    } catch (error) {
      console.error("Error sharing redemption code:", error);
    }
  };

  const handleBack = () => router.back();

  // Render states
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={errorMessage} />;
  if (status === "redeemed") return <SuccessState />;
  if (status === "cancelled" || status === "expired") return <CancelledState />;
  if (!redemptionCode) return <ErrorState message="No redemption code available" />;

  return (
    <ActiveState
      rewardTitle={rewardTitle}
      rewardDescription={rewardDescription}
      redemptionCode={redemptionCode}
      timeRemaining={timeRemaining}
      onShare={handleShare}
      onCancel={cancelCode}
      onBack={handleBack}
      insets={insets}
    />
  );
}
