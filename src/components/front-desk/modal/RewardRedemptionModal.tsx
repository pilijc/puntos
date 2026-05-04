import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { Gem } from "lucide-react-native";
import { processRedemption } from "@/services/frontdesk/reward-redemption-service";
import { RedemptionVerificationResult } from "@/type/frontdesk/reward-redemption";
import { Check } from "lucide-react-native";

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

  if (!visible || !verification?.code) return null;

  const handleConfirmRedemption = async () => {
    setIsProcessing(true);
    try {
      const result = await processRedemption(verification.code!.code, staffId);
      
      if (result.success) {
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        onError(result.message || "Failed to process redemption");
      }
    } catch (error) {
      onError("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl mx-4 max-w-sm w-full p-5">
        {/* header */}
        <View className="items-center mb-4">
          <View className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-full items-center justify-center mb-2">
            <Check size={28} color="#22C55E"/>
          </View>
          <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-white">
            Confirm Redemption
          </Text>
        </View>

        {/* essential info */}
        <View className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 mb-4">
          <Text className="font-poppins-semibold text-neutral-900 dark:text-white mb-1">
            {verification.code.reward_title || "Unknown Reward"}
          </Text>
          <View className="flex-row items-center">
            <Gem size={16} color="#FF6600" />
            <Text className="ml-2 font-poppins-semibold text-orange-600 dark:text-orange-400">
              {verification.code.points_cost.toLocaleString()} points
            </Text>
          </View>
        </View>

        {/* action buttons */}
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
              {isProcessing ? "Processing..." : "Confirm"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
