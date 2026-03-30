import React, { useState } from "react";
import { TouchableOpacity, Text } from "react-native";
import { processVoucherCode } from "@/services/frontdesk/voucher-service";

type Props = {
  voucherCode: string;
  amount: string;
  storeStaffId: string;
  onSuccess: (points: number) => void;
  onError: (message: string) => void;
};

export default function VoucherForm({
  voucherCode,
  amount,
  storeStaffId,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      onError("Invalid amount");
      return;
    }

    if (!voucherCode.trim()) {
      onError("Voucher code is required");
      return;
    }

    setLoading(true);

    try {
      const result = await processVoucherCode(
        voucherCode.trim(),
        parseFloat(amount),
        storeStaffId
      );

      if (result.success) {
        onSuccess(result.pointsEarned ?? 0);
      } else {
        onError(result.message);
      }
    } catch (err) {
      onError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSubmit}
      disabled={loading}
      style={{
        backgroundColor: "#FF6600",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "bold" }}>
        {loading ? "Processing..." : "Enter Code"}
      </Text>
    </TouchableOpacity>
  );
}