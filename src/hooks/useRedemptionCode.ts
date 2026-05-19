import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import {
  generateRedemptionCodeWithRateLimit,
  listenToRedemptionStatus,
  cancelRedemptionCode,
} from "@/services/user/rewards-redemption";
import { RedemptionCode, RedemptionUpdate } from "@/type/user/reward-redemption";

export type RedemptionStatus = "loading" | "active" | "redeemed" | "cancelled" | "expired" | "error" | "rate_limited";

const LOCAL_COOLDOWN_SECONDS = 3;
const GENERATION_TIMEOUT_MS = 10000;
const localRedemptionLocks = new Map<string, number>();

function withGenerationTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Redemption code generation timed out"));
    }, GENERATION_TIMEOUT_MS);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

interface UseRedemptionCodeResult {
  redemptionCode: RedemptionCode | null;
  status: RedemptionStatus;
  errorMessage: string | null;
  timeRemaining: number;
  rateLimitType: "cooldown" | "rate_limit" | null;
  rateLimitTimeRemaining: number;
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
  const [rateLimitType, setRateLimitType] = useState<"cooldown" | "rate_limit" | null>(null);
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState<number>(0);
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const channelRef = useRef<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearRateLimitTimer = useCallback(() => {
    if (rateLimitTimerRef.current) {
      clearInterval(rateLimitTimerRef.current);
      rateLimitTimerRef.current = null;
    }
  }, []);

  const clearSubscription = useCallback(() => {
    if (channelRef.current && typeof channelRef.current.unsubscribe === 'function') {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    }
    channelRef.current = null;
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

      const localLockKey = `${user.id}:${storeId}:${rewardId}`;
      const localLockExpiresAt = localRedemptionLocks.get(localLockKey) ?? 0;
      const now = Date.now();

      if (localLockExpiresAt > now) {
        const retryAfter = Math.max(1, Math.ceil((localLockExpiresAt - now) / 1000));
        setStatus("rate_limited");
        setRateLimitType("cooldown");
        setRateLimitTimeRemaining(retryAfter);
        setErrorMessage("Please wait a moment before generating another code.");
        startRateLimitTimer(retryAfter);
        return;
      }

      localRedemptionLocks.set(localLockKey, now + LOCAL_COOLDOWN_SECONDS * 1000);

      const result = await withGenerationTimeout(
        generateRedemptionCodeWithRateLimit(user.id, rewardId, storeId)
      );

      if (result.success && result.code) {
        setRedemptionCode(result.code);
        setStatus("active");
      } else {
        const message = result.message || "Failed to generate code";
        if (result.rateLimitType) {
          const retryAfter = result.retryAfter ?? (result.rateLimitType === "cooldown" ? 3 : 60);
          localRedemptionLocks.set(localLockKey, Date.now() + retryAfter * 1000);
          setStatus("rate_limited");
          setRateLimitType(result.rateLimitType);
          setRateLimitTimeRemaining(retryAfter);
          setErrorMessage(message);
          startRateLimitTimer(retryAfter);
        } else if (message.includes("Please wait a moment before generating another code")) {
          setStatus("rate_limited");
          setRateLimitType("cooldown");
          setRateLimitTimeRemaining(3);
          setErrorMessage(message);
          startRateLimitTimer(3);
        } else if (message.includes("Too many requests")) {
          setStatus("rate_limited");
          setRateLimitType("rate_limit");
          setRateLimitTimeRemaining(60);
          setErrorMessage(message);
          startRateLimitTimer(60);
        } else {
          setStatus("error");
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error("Error generating redemption code:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message.includes("timed out")
          ? "Generating the code took too long. Please try again."
          : "An error occurred while generating code"
      );
    }
  }, [rewardId, storeId]);

  const startRateLimitTimer = useCallback((seconds: number) => {
    clearRateLimitTimer();
    setRateLimitTimeRemaining(seconds);
    
    rateLimitTimerRef.current = setInterval(() => {
      setRateLimitTimeRemaining((prev) => {
        if (prev <= 1) {
          clearRateLimitTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearRateLimitTimer]);

  // Cancel redemption code
  const cancelCode = useCallback(async () => {
    if (!redemptionCode) return;

    const codeToCancel = redemptionCode;

    clearTimer();
    clearSubscription();
    setStatus("cancelled");
    setErrorMessage(null);

    try {
      const result = await cancelRedemptionCode(codeToCancel.id, codeToCancel.user_id);

      if (!result.success) {
        setStatus("active");
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error("Error cancelling redemption code:", error);
      setStatus("active");
      setErrorMessage("An error occurred while cancelling code");
    }
  }, [redemptionCode, clearTimer, clearSubscription]);

  // Reset code state - call when drawer closes
  const resetCode = useCallback(() => {
    clearTimer();
    clearRateLimitTimer();
    clearSubscription();
    setRedemptionCode(null);
    setStatus("loading");
    setErrorMessage(null);
    setTimeRemaining(0);
    setRateLimitType(null);
    setRateLimitTimeRemaining(0);
  }, [clearTimer, clearRateLimitTimer, clearSubscription]);

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
      clearRateLimitTimer();
      clearSubscription();
    };
  }, [clearTimer, clearRateLimitTimer, clearSubscription]);

  return {
    redemptionCode,
    status,
    errorMessage,
    timeRemaining,
    rateLimitType,
    rateLimitTimeRemaining,
    generateCode,
    cancelCode,
    resetCode,
  };
}
