import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Clock, CheckCircle, Store, Speaker } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { getQRCodeData } from "@/services/user/rewards-redemption";
import { useRedemptionCode } from "@/hooks/useRedemptionCode";
import { RedemptionQRSkeleton } from "@/components/skeleton/user/redemption-qr-skeleton";

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
      <View className="items-center justify-center">
        <RedemptionQRSkeleton />
        <Text className="text-neutral-500 dark:text-neutral-400 text-sm font-poppins-medium mt-4">
          Generating code...
        </Text>
      </View>
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

function RateLimitedState({ 
  message, 
  rateLimitType, 
  timeRemaining 
}: { 
  message: string | null; 
  rateLimitType: "cooldown" | "rate_limit" | null;
  timeRemaining: number;
}) {
  const isCooldown = rateLimitType === "cooldown";
  const title = isCooldown ? "Please wait" : "Too many requests";
  const subtitle = isCooldown 
    ? `Retrying in ${timeRemaining} seconds...`
    : `Try again in ${timeRemaining} seconds`;

  return (
    <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center px-6">
      <View className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full items-center justify-center mb-4">
        <Clock size={40} color="#FF6600" />
      </View>
      <Text className="text-orange-600 font-poppins-bold text-xl mb-2">
        {title}
      </Text>
      <Text className="text-neutral-600 dark:text-neutral-400 text-center text-sm mb-4">
        {message}
      </Text>
      <View className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl px-6 py-4">
        <Text className="text-orange-600 font-poppins-semibold text-lg">
          {subtitle}
        </Text>
      </View>
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
  rewardImage?: string;
  redemptionCode: { code: string; expires_at: string };
  timeRemaining: number;
  onCancel: () => void;
  onBack: () => void;
  insets: { top: number; bottom: number };
}

function ActiveState({
  rewardTitle,
  rewardDescription,
  rewardImage,
  redemptionCode,
  timeRemaining,
  onCancel,
  onBack,
  insets,
}: ActiveStateProps) {
  const isExpiringSoon = timeRemaining < 60;

  // Format code like "M 813 161"
  const formattedCode = redemptionCode.code
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/([a-zA-Z])(\d)/, "$1 $2")
    .replace(/(\d{3})(\d{3})/, "$1 $2");

  return (
    <View className="flex-1 bg-white">
      {/* Yellow Header Section */}
      <View className="bg-yellow-400 rounded-b-3xl" style={{ paddingTop: insets.top }}>
        {/* Header with close button */}
        <View className="flex-row items-center justify-center px-4 py-4 relative">
          <Text className="text-lg font-poppins-semibold text-neutral-900">
            Scan to redeem
          </Text>
          <TouchableOpacity
            onPress={onBack}
            className="absolute left-4 w-10 h-10 items-center justify-center"
          >
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* QR Code Card */}
        <View className="mx-4 mb-6">
          <View className="bg-neutral-100 rounded-2xl p-6 items-center">
            <View className="bg-white rounded-xl p-4 mb-4">
              <QRCode
                value={getQRCodeData(redemptionCode.code)}
                size={160}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text className="text-2xl font-poppins-bold text-neutral-900 tracking-wide">
              {formattedCode}
            </Text>
          </View>
        </View>

        {/* Time left */}
        <View className="items-center mb-6">
          <Text className="text-sm text-neutral-700 mb-1">
            Slow Connection Please Try Again
          </Text>
          <Text
            className={`text-3xl font-poppins-bold ${
              isExpiringSoon ? "text-red-600" : "text-neutral-900"
            }`}
          >
            {formatTime(timeRemaining)}
          </Text>
        </View>

        {/* Reward Card */}
        <View className="mx-4 mb-6">
          <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm">
            <View className="flex-1 pr-4">
              <Text className="text-base font-poppins-semibold text-neutral-900 leading-snug">
                {rewardTitle}
              </Text>
              {rewardDescription && (
                <Text className="text-sm text-neutral-500 mt-1">
                  {rewardDescription}
                </Text>
              )}
            </View>
            {rewardImage ? (
              <Image
                source={{ uri: rewardImage }}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-xl bg-yellow-100 items-center justify-center">
                <Text className="text-2xl">🎁</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Instructions Section */}
      <View className="flex-1 bg-white px-4 pt-6" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="bg-neutral-100 rounded-2xl p-5 space-y-5">
          {/* In the restaurant */}
          <View className="flex-row items-start">
            <View className="w-10 h-10 bg-white rounded-lg items-center justify-center mr-4">
              <Store size={20} color="#1f2937" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-poppins-semibold text-neutral-900 mb-1">
                In the restaurant
              </Text>
              <Text className="text-sm text-neutral-600 leading-relaxed">
                Scan the code in the ordering kiosk or present the code to staff at the front counter.
              </Text>
            </View>
          </View>

          {/* DriveThru */}
          <View className="flex-row items-start">
            <View className="w-10 h-10 bg-neutral-800 rounded-lg items-center justify-center mr-4">
              <Speaker size={20} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-poppins-semibold text-neutral-900 mb-1">
                DriveThru
              </Text>
              <Text className="text-sm text-neutral-600 leading-relaxed">
                Tell us about the code at the speaker.
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={onCancel}
          className="mt-6 py-4 items-center"
        >
          <Text className="text-red-500 font-poppins-semibold">
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
  const { rewardId, storeId, rewardTitle, rewardDescription, rewardImage } =
    useLocalSearchParams<{
      rewardId?: string;
      storeId?: string;
      rewardTitle?: string;
      rewardDescription?: string;
      rewardImage?: string;
    }>();

  const {
    redemptionCode,
    status,
    errorMessage,
    timeRemaining,
    rateLimitType,
    rateLimitTimeRemaining,
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

  useEffect(() => {
    if (status === "redeemed") {
      setTimeout(() => router.back(), REDIRECT_DELAY.REDEEMED);
    } else if (status === "cancelled") {
      setTimeout(() => router.back(), REDIRECT_DELAY.CANCELLED);
    } else if (status === "expired") {
      setTimeout(() => router.back(), REDIRECT_DELAY.EXPIRED);
    }
  }, [status, router]);

  const handleBack = () => router.back();

  // Render states
  if (status === "loading") return <LoadingState />;
  if (status === "rate_limited") return (
    <RateLimitedState 
      message={errorMessage} 
      rateLimitType={rateLimitType} 
      timeRemaining={rateLimitTimeRemaining}
    />
  );
  if (status === "error") return <ErrorState message={errorMessage} />;
  if (status === "redeemed") return <SuccessState />;
  if (status === "cancelled" || status === "expired") return <CancelledState />;
  if (!redemptionCode) return <ErrorState message="No redemption code available" />;

  return (
    <ActiveState
      rewardTitle={rewardTitle}
      rewardDescription={rewardDescription}
      rewardImage={rewardImage}
      redemptionCode={redemptionCode}
      timeRemaining={timeRemaining}
      onCancel={cancelCode}
      onBack={handleBack}
      insets={insets}
    />
  );
}
