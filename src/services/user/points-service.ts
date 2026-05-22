import { logger } from "@/utils/logger";
import {supabase} from "@/supabase/supabase"
import {UserPointsSummary} from "@/type/user/points"
import {ServiceResponse} from "@/type/service-response"

export async function getUserPoints(userId: string, storeId?: string): Promise<ServiceResponse<UserPointsSummary>> {
    const rpcParams: {
        p_user_id: string;
        p_store_id?: number;
    } = {
        p_user_id: userId,
    };
    
    if (storeId) {
        rpcParams.p_store_id = parseInt(storeId, 10);
    }

    const { data, error } = await supabase.rpc("get_user_points_summary", rpcParams);

    if (error) {
        logger.error("error getting points summary from rpc", error);
        return { data: null, error: new Error(`RPC get_user_points_summary failed: ${error.message}`) };
    }

    if (!data || data.length === 0) {
        return {
            data: null,
            error: new Error("No points summary returned from RPC"),
        };
    }

    const summary = data[0];
    return {
        data: {
            totalPoints: summary.total_points || 0,
            spentPoints: summary.spent_points || 0,
            availablePoints: summary.available_points || 0
        },
        error: null
    };
}

export async function getUserAvailablePoints(userId: string, storeId?: string): Promise<ServiceResponse<number>> {
    const { data: summary, error: summaryError } = await getUserPoints(userId, storeId);
    
    if (summaryError || !summary) {
        return { data: null, error: summaryError || new Error("Failed to get user points summary") };
    }

    let activeCodesQuery = supabase
        .from("reward_redemption_codes")
        .select("code, points_cost")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
    
    if (storeId) {
        activeCodesQuery = activeCodesQuery.eq("store_id", storeId);
    }
    
    const { data: activeCodes, error: activeCodesError } = await activeCodesQuery;
        
    if (activeCodesError) {
        logger.error("error getting active codes", activeCodesError);
        return { data: null, error: new Error(activeCodesError.message) };
    }
    
    if (activeCodes) {
        const reservedPoints = activeCodes.reduce((sum, code) => sum + (code.points_cost || 0), 0);
        return { data: Math.max(0, summary.availablePoints - reservedPoints), error: null };
    }
    
    return { data: summary.availablePoints, error: null };
}

 


