import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import {
  generateRedemptionCode,
  listenToRedemptionStatus,
  cancelRedemptionCode,
} from "@/services/user/rewards-redemption";
import { RedemptionCode, RedemptionUpdate } from "@/type/user/reward-redemption";

export type RedemptionStatus = "loading" | "active" | "redeemed" | "cancelled" | "expired" | "error";

interface UseRedemptionCodeResult {
  redemptionCode: RedemptionCode | null;
  status: RedemptionStatus;
  errorMessage: string | null;
  timeRemaining: number;
  generateCode: () => Promise<void>;
  cancelCode: () => Promise<void>;
  resetCode: () => void;
}

export function useRedemptionCode(
  rewardId: string | undefined,
  storeId: string | undefined
): UseRedemptionCodeResult {
  const [redemptionCode, setRedemptionCode] = useState<RedemptionCode | null>(null);
  const [status, setStatus] = useState<RedemptionStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const channelRef = useRef<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSubscription = useCallback(() => {
    if (channelRef.current && typeof channelRef.current.unsubscribe === 'function') {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
      channelRef.current = null;
    }
  }, []);

  // Generate redemption code
  const generateCode = useCallback(async () => {
    if (!rewardId || !storeId) {
      setStatus("error");
      setErrorMessage("Missing reward or store information");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setStatus("error");
        setErrorMessage("User not authenticated");
        return;
      }

      const result = await generateRedemptionCode(user.id, rewardId, storeId);

      if (result.success && result.code) {
        setRedemptionCode(result.code);
        setStatus("active");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Failed to generate code");
      }
    } catch (error) {
      console.error("Error generating redemption code:", error);
      setStatus("error");
      setErrorMessage("An error occurred while generating code");
    }
  }, [rewardId, storeId]);

  // Cancel redemption code
  const cancelCode = useCallback(async () => {
    if (!redemptionCode) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        await cancelRedemptionCode(redemptionCode.id, user.id);
        clearTimer();
        clearSubscription();
        setStatus("cancelled");
      }
    } catch (error) {
      console.error("Error cancelling redemption code:", error);
    }
  }, [redemptionCode, clearTimer, clearSubscription]);

  // Reset code state - call when drawer closes
  const resetCode = useCallback(() => {
    clearTimer();
    clearSubscription();
    setRedemptionCode(null);
    setStatus("loading");
    setErrorMessage(null);
    setTimeRemaining(0);
  }, [clearTimer, clearSubscription]);

  // Listen to redemption status if be change
  useEffect(() => {
    if (status !== "active" || !redemptionCode) return;

    channelRef.current = listenToRedemptionStatus(
      redemptionCode.id,
      (update: RedemptionUpdate) => {
        if (update.status === "redeemed") {
          clearTimer();
          setStatus("redeemed");
        }
      }
    );

    return clearSubscription;
  }, [status, redemptionCode, clearTimer, clearSubscription]);


  useEffect(() => {
    if (status !== "active" || !redemptionCode) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(redemptionCode.expires_at).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearTimer();
        setStatus("expired");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return clearTimer;
  }, [status, redemptionCode, clearTimer]);

  // Cleanup 
  useEffect(() => {
    return () => {
      clearTimer();
      clearSubscription();
    };
  }, [clearTimer, clearSubscription]);

  return {
    redemptionCode,
    status,
    errorMessage,
    timeRemaining,
    generateCode,
    cancelCode,
    resetCode,
  };
}
