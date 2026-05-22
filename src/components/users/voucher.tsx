import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { VoucherGeneratorProps, Voucher } from "@/type/user/voucher";
import { generateVoucherCode } from "@/services/user/voucher-service";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { logger } from "@/utils/logger";

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
      logger.error("Voucher error:", err);
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
    <View className="items-center justify-center px-4">
      {!voucher ? (
        <Button
          label={translate("user.qr.voucher.generate")}
          onPress={generateVoucher}
          authButton
          disabled={loading}
          loading={loading}
          variant="primary"
        />
        // <TouchableOpacity
        //   onPress={generateVoucher}
        //   disabled={loading}
        //   className="bg-orange-500 px-8 py-4 rounded-xl"
        // >
        //   {loading ? (
        //     <ActivityIndicator size="small" color="#FFFFFF" />
        //   ) : (
        //     <Text className="text-white font-bold text-lg">{translate("user.qr.voucher.generate")}</Text>
        //   )}
        // </TouchableOpacity>
      ) : (
        <>
          <Text className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">{translate("user.qr.voucher.title")}</Text>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mb-4">
            {translate("user.qr.voucher.expires", {
              time: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
            })}
          </Text>
          <View className="bg-white p-4 rounded-xl mb-4 elevation-100">
            <Text className="text-2xl font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">{voucher.code}</Text>
          </View>
          <Button 
            label={translate("user.qr.voucher.generateNew")} 
            onPress={generateVoucher} 
            authButton
            disabled={loading} 
            variant="primary" 
            loading={loading}
          />
        </>
      )}
    </View>
  );
};