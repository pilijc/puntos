import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Share2, X, Clock, CheckCircle } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { supabase } from "@/supabase/supabase";
import { generateRedemptionCode, listenToRedemptionStatus, cancelRedemptionCode, getQRCodeData } from "@/services/user/rewards-redemption";
import { RedemptionCode, RedemptionUpdate } from "@/type/user/reward-redemption";

export default function RedemptionCodeScreen() {
  const { rewardId, storeId, rewardTitle, rewardDescription, rewardImage, pointsCost } = useLocalSearchParams<{
    rewardId?: string;
    storeId?: string;
    rewardTitle?: string;
    rewardDescription?: string;
    rewardImage?: string;
    pointsCost?: string;
  }>();

  const [redemptionCode, setRedemptionCode] = useState<RedemptionCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const channelRef = useRef<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!rewardId || !storeId) {
      router.back();
      return;
    }

    generateCode();
  }, [rewardId, storeId]);

  useEffect(() => {
    if (redemptionCode && redemptionCode.status === "active") {
      channelRef.current = listenToRedemptionStatus(redemptionCode.id, (update: RedemptionUpdate) => {
        if (update.status === "redeemed") {
          setIsRedeemed(true);
          setTimeout(() => {
            router.back();
          }, 2000);
        }
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [redemptionCode]);

  useEffect(() => {
    if (redemptionCode && redemptionCode.status === "active") {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(redemptionCode.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setIsCancelled(true);
          setTimeout(() => {
            router.back();
          }, 2000);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [redemptionCode]);

  const generateCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const result = await generateRedemptionCode(user.id, rewardId!, storeId!);
      if (result.success && result.code) {
        setRedemptionCode(result.code);
      } else {
        setErrorMessage(result.message || "Failed to generate code");
      }
    } catch (error) {
      console.error("Error generating redemption code:", error);
      setErrorMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (redemptionCode) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await cancelRedemptionCode(redemptionCode.id, user.id);
          setIsCancelled(true);
          setTimeout(() => {
            router.back();
          }, 1500);
        }
      } catch (error) {
        console.error("Error cancelling redemption code:", error);
      }
    }
  };

  const handleShare = async () => {
    if (redemptionCode) {
      try {
        await Share.share({
          message: `Redemption Code: ${redemptionCode.code}`,
        });
      } catch (error) {
        console.error("Error sharing redemption code:", error);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
        <Text className="text-neutral-500 dark:text-neutral-400">Generating code...</Text>
      </View>
    );
  }

  if (!redemptionCode) {
    return (
      <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center px-6">
        <Text className="text-red-500 font-poppins-bold text-lg mb-2">Failed to generate code</Text>
        {errorMessage && (
          <Text className="text-neutral-500 dark:text-neutral-400 text-center text-sm">
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }

  if (isRedeemed) {
    return (
      <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
        <Animated.View entering={FadeIn} className="items-center">
          <CheckCircle size={64} color="#10B981" />
          <Text className="text-green-600 font-poppins-bold text-lg mt-4">Successfully Redeemed!</Text>
        </Animated.View>
      </View>
    );
  }

  if (isCancelled) {
    return (
      <View className="flex-1 bg-white dark:bg-darkBackground items-center justify-center">
        <Animated.View entering={FadeIn} className="items-center">
          <X size={64} color="#EF4444" />
          <Text className="text-red-500 font-poppins-bold text-lg mt-4">Code Cancelled</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-darkBackground">
      {/* Header */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 20 }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
          >
            <ChevronLeft size={20} color="#FF6600" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
          >
            <Share2 size={20} color="#FF6600" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {/* Reward Info */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white mb-2">
            {rewardTitle}
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-center">
            {rewardDescription}
          </Text>
        </View>

        {/* QR Code */}
        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg mb-6">
          <View className="items-center">
            <QRCode
              value={getQRCodeData(redemptionCode.code)}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
        </View>

        {/* Voucher Code */}
        <View className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 mb-6">
          <Text className="text-center text-neutral-600 dark:text-neutral-400 mb-2 font-poppins-medium">
            Voucher Code
          </Text>
          <Text className="text-center text-3xl font-poppins-bold text-orange-600 dark:text-orange-400">
            {redemptionCode.code}
          </Text>
        </View>

        {/* Timer */}
        <View className="flex-row items-center justify-center mb-8">
          <Clock size={16} color={timeRemaining < 60 ? "#EF4444" : "#6B7280"} />
          <Text className={`ml-2 font-poppins-medium ${
            timeRemaining < 60 ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"
          }`}>
            Expires in {formatTime(timeRemaining)}
          </Text>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={handleCancel}
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
