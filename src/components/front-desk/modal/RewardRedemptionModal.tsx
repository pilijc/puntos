import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "@/tw";
import { Gem, User, Clock, AlertCircle, CheckCircle2 } from "lucide-react-native";
import { Button } from "@/components/button";
import { processRedemption } from "@/services/frontdesk/reward-redemption-service";
import { RedemptionVerificationResult } from "@/type/frontdesk/reward-redemption";

interface Props {
  visible: boolean;
  verification: RedemptionVerificationResult | null;
  staffId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function RewardRedemptionModal({
  visible,
  verification,
  staffId,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!visible || !verification?.code) return null;

  const handleConfirmRedemption = async () => {
    setIsProcessing(true);
    try {
      const result = await processRedemption(verification.code!.code, staffId);

      if (result.success) {
        setShowSuccess(true);
        onSuccess();
      } else {
        onError(result.message || "Failed to process redemption");
      }
    } catch (error) {
      onError("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    onClose();
    setTimeout(() => setShowSuccess(false), 300);
  };

  if (showSuccess) {
    return (
      <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
        <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl mx-4 max-w-sm w-full p-8 items-center shadow-lg">
          <View className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full items-center justify-center mb-5 shadow-sm">
            <CheckCircle2 size={56} color="#10B981" />
          </View>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white mb-2 text-center">
            Reward Redeemed!
          </Text>
          <Text className="text-base font-poppins-medium text-neutral-500 dark:text-neutral-400 text-center px-4 leading-relaxed">
            The reward has been successfully redeemed. Points have been deducted from the customer's account.
          </Text>
          <View className="mt-6 w-full">
            <View className="bg-green-50 dark:bg-green-900/20 rounded-xl py-4 px-6 border border-green-100 dark:border-green-900/30">
              <View className="flex-row items-center justify-center">
                <Gem size={20} color="#FF6600" />
                <Text className="ml-2 font-poppins-bold text-orange-600 dark:text-orange-400">
                  -{verification.code?.points_cost?.toLocaleString() || 0} points
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-6 w-full">
            <Button
              label="Done"
              onPress={handleCloseSuccess}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl mx-4 max-w-sm w-full p-6">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full items-center justify-center mb-3">
            <Gem size={32} color="#FF6600" />
          </View>
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white">
            Reward Redemption
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1">
            Confirm reward redemption for customer
          </Text>
        </View>

        {/* Reward Info */}
        <View className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-4">
          <Text className="font-poppins-semibold text-neutral-900 dark:text-white mb-2">
            {verification.code.reward_title || "Unknown Reward"}
          </Text>
          {verification.code.reward_description && (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              {verification.code.reward_description}
            </Text>
          )}

          {verification.code.reward_image_url && (
            <Image
              source={{ uri: verification.code.reward_image_url }}
              className="w-full h-32 rounded-lg mb-3"
              contentFit="cover"
            />
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Gem size={16} color="#FF6600" />
              <Text className="ml-2 font-poppins-semibold text-orange-600 dark:text-orange-400">
                {verification.code.points_cost.toLocaleString()} points
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color="#6B7280" />
              <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                Expires soon
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl py-3 items-center"
            disabled={isProcessing}
          >
            <Text className="font-poppins-semibold text-neutral-700 dark:text-neutral-300">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirmRedemption}
            className="flex-1 bg-orange-500 rounded-xl py-3 items-center"
            disabled={isProcessing}
          >
            <Text className="font-poppins-semibold text-white">
              {isProcessing ? "Processing..." : "Confirm Redemption"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
