 import { supabase } from "@/supabase/supabase";
import {
  RedemptionCode,
  GenerateCodeResult,
  RedemptionUpdate,
  ActiveRedemptionWithReward,
} from "@/type/user/reward-redemption";
import { getUserAvailablePoints } from "@/services/user/points-service";

const REDEMPTION_CODE_PREFIX = "RWD";
const CODE_LENGTH = 6;
const EXPIRY_MINUTES = 10;

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${REDEMPTION_CODE_PREFIX}${result}`;
}

function getExpiryTimestamp(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + EXPIRY_MINUTES);
  return expiry.toISOString();
}

export async function generateRedemptionCode(
  userId: string,
  rewardId: string,
  storeId: string
): Promise<GenerateCodeResult> {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      console.error("User authentication failed:", userError);
      return { success: false, message: "User not authenticated" };
    }

    const { data: reward, error: rewardError } = await supabase
      .from("store_rewards")
      .select("id, title, description, image_url, points_cost, stock, is_active")
      .eq("id", parseInt(rewardId))
      .eq("store_id", parseInt(storeId))
      .single();

    if (rewardError || !reward) {
      console.error("Reward not found:", rewardError, "rewardId:", rewardId, "storeId:", storeId);
      return { success: false, message: "Reward not found" };
    }

    if (!reward.is_active) {
      console.error("Reward is not active:", reward.id);
      return { success: false, message: "Reward is not active" };
    }

    if (reward.stock !== null && reward.stock <= 0) {
      console.error("Reward is out of stock:", reward.id, "stock:", reward.stock);
      return { success: false, message: "Reward is out of stock" };
    }

     const availablePoints = await getUserAvailablePoints(userId, storeId);
    console.log("Available points:", availablePoints, "Required:", reward.points_cost);
    
    if (availablePoints < reward.points_cost) {
      return { success: false, message: "Insufficient points" };
    }

    const code = generateRandomCode();
    const expiresAt = getExpiryTimestamp();

    const { data: redemptionCode, error: codeError } = await supabase
      .from("reward_redemption_codes")
      .insert({
        code,
        user_id: userId,
        reward_id: parseInt(rewardId),
        store_id: parseInt(storeId),
        reward_title: reward.title,
        reward_description: reward.description,
        reward_image_url: reward.image_url,
        points_cost: reward.points_cost,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (codeError || !redemptionCode) {
      console.error("Database error inserting redemption code:", codeError);
      return { success: false, message: "Failed to generate redemption code" };
    }

    return { success: true, code: redemptionCode };
  } catch (error) {
    console.error("Error generating redemption code:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function getActiveRedemptionCodes(
  userId: string
): Promise<ActiveRedemptionWithReward[]> {
  try {
    const { data, error } = await supabase
      .from("reward_redemption_codes")
      .select(`
        *,
        reward:store_rewards(
          title,
          description,
          image_url
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active redemption codes:", error);
      return [];
    }

    return (data || []) as ActiveRedemptionWithReward[];
  } catch (error) {
    console.error("Error fetching active redemption codes:", error);
    return [];
  }
}

export function listenToRedemptionStatus(
  codeId: string,
  onStatusChange: (update: RedemptionUpdate) => void
) {
  let retryCount = 0;
  const maxRetries = 10;
  const baseDelay = 2000;

  const subscribeWithRetry = () => {
    if (retryCount >= maxRetries) {
      console.error(`Max retries (${maxRetries}) reached for redemption status listener. Real-time may not be enabled for reward_redemption_codes table.`);
      return null;
    }

    const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);

    const channel = supabase
      .channel(`redemption-status-${codeId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: codeId },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reward_redemption_codes",
          filter: `id=eq.${codeId}`,
        },
        (payload) => {
          const updated = payload.new as RedemptionCode;
          onStatusChange({
            status: updated.status,
            redeemed_at: updated.redeemed_at,
          });
        }
      )
      .subscribe((status) => {
        console.log(`Redemption status listener for code ${codeId}:`, status);
        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to redemption status for code ${codeId}`);
          retryCount = 0;
        } else if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error(`Redemption status listener failed for code ${codeId}:`, status);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Reconnecting in ${delay/1000}s... (attempt ${retryCount}/${maxRetries})`);
            setTimeout(() => {
              subscribeWithRetry();
            }, delay);
          } else {
            console.error(`Max retries reached. Real-time may need to be enabled for reward_redemption_codes table in Supabase.`);
          }
        }
      });

    return channel;
  };

  return subscribeWithRetry();
}

export async function cancelRedemptionCode(
  codeId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("reward_redemption_codes")
      .update({
        status: "cancelled",
      })
      .eq("id", codeId)
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      return { success: false, message: "Failed to cancel redemption code" };
    }

    return { success: true, message: "Redemption code cancelled" };
  } catch (error) {
    console.error("Error cancelling redemption code:", error);
    return { success: false, message: "An error occurred" };
  }
}

export function getQRCodeData(code: string): string {
  return `puntos:reward:${code}`;
}

export async function deductPoints(
    userId: string,
    storeId: string,
    pointsToDeduct: number
): Promise<{ success: boolean; message: string; remainingPoints?: number }> {
    try {

        const currentPoints = await getUserAvailablePoints(userId, storeId);

        if (currentPoints < pointsToDeduct) {
            return {
                success: false,
                message: "Insufficient points available"
            };
        }

        const updatedPoints = await getUserAvailablePoints(userId, storeId);

        return {
            success: true,
            message: "Points deducted successfully",
            remainingPoints: updatedPoints
        };

    } catch (error) {
        console.error("Error deducting points:", error);
        return {
            success: false,
            message: "An error occurred while deducting points"
        };
    }
}

export function listenToUserRedemptions(
  userId: string,
  onNewRedemption: (redemption: any) => void
) {
  return supabase
    .channel(`user-redemptions-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reward_redemptions",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("User redemption realtime triggered:", payload);
        const newRedemption = payload.new;
        onNewRedemption(newRedemption);
      }
    )
    .subscribe((status) => {
      console.log(`User redemptions listener status for user ${userId}:`, status);
    });
}
