import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { VoucherGeneratorProps, Voucher } from "@/type/user/voucher";
import { generateVoucherCode } from "@/services/user/voucher-service";
import { useTranslation } from "react-i18next";


export const VoucherGenerator: React.FC<VoucherGeneratorProps> = ({
  userId,
  durationMinutes = 5,
  onVoucherReady,
}) => {
  const { t: translate } = useTranslation();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const generateVoucher = async () => {
    if (!userId) {
      Alert.alert(translate("label.error"), translate("user.qr.voucher.userIdRequired"));
      return;
    }

    setLoading(true);
    try {

      const newVoucher = await generateVoucherCode(userId, durationMinutes);
      setVoucher(newVoucher);
      onVoucherReady?.(newVoucher);

      const expiresAt = new Date(newVoucher.expires_at).getTime();
      setTimeLeft(Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0));
    } catch (err) {
      console.error("Voucher error:", err);
      Alert.alert(translate("label.error"), translate("user.qr.voucher.failed"));
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!voucher) return;

    const interval = setInterval(() => {
      if (voucher) {
        const expiresAt = new Date(voucher.expires_at).getTime();
        const secondsLeft = Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0);

        if (secondsLeft === 0) {
          setVoucher(null);
          setTimeLeft(0);
        } else {
          setTimeLeft(secondsLeft);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [voucher]);

  return (
    <View className="items-center justify-center mt-8 p-4">
      {!voucher ? (
        <TouchableOpacity
          onPress={generateVoucher}
          disabled={loading}
          className="bg-orange-500 px-8 py-4 rounded-xl"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">{translate("user.qr.voucher.generate")}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <Text className="text-sm font-semibold mb-2 text-gray-800 dark:text-darkTextPrimary">{translate("user.qr.voucher.title")}</Text>
          <View className="bg-white p-4 rounded-2xl mb-2  border border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">{voucher.code}</Text>
          </View>
          <Text className="text-xs text-gray-500 dark:text-darkTextSecondary mb-4">
            {translate("user.qr.voucher.expires", {
              time: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
            })}
          </Text>
          <TouchableOpacity
            onPress={generateVoucher}
            disabled={loading}
            className="bg-orange-500 px-6 py-3 rounded-xl"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold">{translate("user.qr.voucher.generateNew")}</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};