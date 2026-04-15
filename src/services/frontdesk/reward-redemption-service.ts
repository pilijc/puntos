import {supabase} from "@/supabase/supabase" ;
import {RedemptionVerificationResult, RedemptionProcessResult, RedemptionHistoryItem} from "@/type/frontdesk/reward-redemption";
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
 
    const availablePoints = await getUserAvailablePoints(codeData.user_id, codeData.store_id);
    if (availablePoints < codeData.reward.points_cost) {
      return { success: false, message: "Insufficient points" };
    }
 
     if (codeData.reward.stock <= 0) {
      return { success: false, message: "Reward out of stock" };
    }
 
    return {
      success: true,
      code: codeData,   
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
      return { success: false, message: "Failed to record redemption" };
    }

    // Import and use the points service
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

    const { error: codeUpdateError } = await supabase
      .from("reward_redemption_codes")
      .update({
        status: "redeemed",
        redeemed_at: now,
      })
      .eq("id", verification.code.id);

    if (codeUpdateError) {
      console.error("Error updating redemption code status:", codeUpdateError);
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