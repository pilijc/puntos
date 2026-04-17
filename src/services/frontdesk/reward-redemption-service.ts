import {supabase} from "@/supabase/supabase" ;
import {RedemptionVerificationResult, RedemptionProcessResult, RedemptionHistoryItem, RedemptionCodeWithReward} from "@/type/frontdesk/reward-redemption";
import { getUserAvailablePoints } from "../user/points-service";

export async function verifyRedemptionCode(code: string, staffId: string): 
Promise<RedemptionVerificationResult> {
  try {
    const {data: codeData, error: codeError} = await supabase
      .from("reward_redemption_codes")
      .select('*,reward:store_rewards(title, description, image_url, points_cost, stock)')
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (codeError) throw codeError;
    if (!codeData) return { success: true, message: "Invalid or expired code" };

    const codeWithReward = codeData as RedemptionCodeWithReward;

    const availablePoints = await getUserAvailablePoints(codeWithReward.user_id, codeWithReward.store_id);
    if (availablePoints < codeWithReward.reward.points_cost) {
      return { success: false, message: "Insufficient points" };
    }

     if (codeWithReward.reward.stock <= 0) {
      return { success: false, message: "Reward out of stock" };
    }

    return {
      success: true,
      code: codeWithReward,
    };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, message: "Verification failed" };
  }
}

export async function processRedemption(
  code: string,
  staffId: string
): Promise<RedemptionProcessResult> {
  try {
    const verification = await verifyRedemptionCode(code, staffId);
    if (!verification.success || !verification.code) {
      return {
        success: false,
        message: verification.message || "Invalid redemption code",
      };
    }

    const { data: staffData, error: staffError } = await supabase
      .from("store_staff")
      .select("store_id")
      .eq("user_id", staffId)
      .eq("is_active", true)
      .single();

    if (staffError || !staffData) {
      return { success: false, message: "Staff verification failed" };
    }

    const now = new Date().toISOString();

    // Update redemption code status to "redeemed" first to release reserved points
    const { error: codeUpdateError } = await supabase
      .from("reward_redemption_codes")
      .update({
        status: "redeemed",
        redeemed_at: now,
      })
      .eq("id", verification.code.id);

    if (codeUpdateError) {
      console.error("Error updating redemption code status:", codeUpdateError);
      return { success: false, message: "Failed to update redemption code status" };
    }

    const { data: redemption, error: redemptionError } = await supabase
      .from("reward_redemptions")
      .insert({
        user_id: verification.code.user_id,
        reward_id: verification.code.reward_id,
        points_spent: verification.code.points_cost,
        store_id: verification.code.store_id,
        created_at: now,
      })
      .select()
      .single();

    if (redemptionError || !redemption) {
      // Rollback code status update if redemption insertion fails
      await supabase
        .from("reward_redemption_codes")
        .update({
          status: "active",
          redeemed_at: null,
        })
        .eq("id", verification.code.id);
      
      return { success: false, message: "Failed to record redemption" };
    }

    const { deductPoints } = await import("@/services/user/rewards-redemption");
    
    const pointsResult = await deductPoints(
      verification.code.user_id,
      verification.code.store_id.toString(),
      verification.code.points_cost
    );

    if (!pointsResult.success) {
      await supabase
        .from("reward_redemptions")
        .delete()
        .eq("id", redemption.id);
      
      return { success: false, message: pointsResult.message };
    }

    // Decrement reward stock
    const { error: stockUpdateError } = await supabase
      .from("store_rewards")
      .update({
        stock: verification.code!.reward.stock - 1,
      })
      .eq("id", verification.code!.reward_id);

    if (stockUpdateError) {
      console.error("Error updating reward stock:", stockUpdateError);
    }

    return {
      success: true,
      redemptionId: redemption.id,
      pointsDeducted: verification.code.points_cost,
      remainingPoints: pointsResult.remainingPoints || 0,
    };
  } catch (error) {
    console.error("Error processing redemption:", error);
    return { success: false, message: "An error occurred" };
  }
}

export async function getRedemptionHistory(
  storeId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: RedemptionHistoryItem[]; hasMore: boolean }> {
  try {
    const { data, error } = await supabase
      .from("reward_redemptions")
      .select(`
        id,
        user_id,
        reward_id,
        points_spent,
        created_at,
        users!user_id(
          name
        ),
        store_rewards!reward_id(
          title
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching redemption history:", error);
      return { items: [], hasMore: false };
    }

    const items: RedemptionHistoryItem[] = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.users?.name || "Unknown User",
      reward_title: item.store_rewards?.title || "Unknown Reward",
      points_spent: item.points_spent,
      created_at: item.created_at,
      method: "voucher" as const,
    }));

    const hasMore = (data || []).length === limit;

    return { items, hasMore };
  } catch (error) {
    console.error("Error fetching redemption history:", error);
    return { items: [], hasMore: false };
  }
}

export function parseRedemptionQR(qrData: string): string | null {
  const parts = qrData.split(":");
  if (parts.length === 3 && parts[0] === "puntos" && parts[1] === "reward") {
    return parts[2];
  }
  return null;
}

export function listenToRewardRedemptions(
  storeId: number,
  onNewRedemption: (redemption: RedemptionHistoryItem) => void
) {
  let retryCount = 0;
  const maxRetries = 10;
  const baseDelay = 2000;

  const subscribeWithRetry = () => {
    if (retryCount >= maxRetries) {
      console.error(`Max retries (${maxRetries}) reached for reward redemptions listener. Real-time may not be enabled for reward_redemptions table.`);
      return null;
    }

    const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);

    const channel = supabase
      .channel(`reward-redemptions-${storeId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `store-${storeId}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reward_redemptions",
          filter: `store_id=eq.${storeId}`,
        },
        async (payload) => {
          console.log("Reward redemption realtime triggered:", payload);
          const newRedemption = payload.new as any;

          // Fetch user name and reward title
          const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", newRedemption.user_id)
            .single();

          const { data: rewardData } = await supabase
            .from("store_rewards")
            .select("title")
            .eq("id", newRedemption.reward_id)
            .single();

          const item: RedemptionHistoryItem = {
            id: newRedemption.id,
            user_id: newRedemption.user_id,
            user_name: userData?.name || "Customer",
            reward_title: rewardData?.title || "Reward",
            points_spent: newRedemption.points_spent,
            created_at: newRedemption.created_at,
            method: "voucher",
          };
          onNewRedemption(item);
        }
      )
      .subscribe((status) => {
        console.log(`Reward redemptions listener status for store ${storeId}:`, status);
        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to reward redemptions for store ${storeId}`);
          retryCount = 0;
        } else if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error(`Reward redemptions listener failed for store ${storeId}:`, status);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Reconnecting in ${delay/1000}s... (attempt ${retryCount}/${maxRetries})`);
            setTimeout(() => {
              subscribeWithRetry();
            }, delay);
          } else {
            console.error(`Max retries reached. Real-time may need to be enabled for reward_redemptions table in Supabase.`);
          }
        }
      });

    return channel;
  };

  return subscribeWithRetry();
}