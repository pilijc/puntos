import React, { useState } from "react";
import { processVoucherCode } from "@/services/frontdesk/voucher-service";
import { Button } from "@/components/button";

export type VoucherFormProps = {
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
}: VoucherFormProps) {
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
        storeStaffId,
      );

      if (result.success) {
        onSuccess(result.pointsEarned ?? 0);
      } else {
        onError(result.message);
      }
    } catch {
      onError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      label={loading ? "Processing..." : "Enter Code"}
      onPress={handleSubmit}
      loading={loading}
      disabled={loading}
    />
  );
}
