import {supabase} from "@/supabase/supabase"
import {UserPointsSummary} from "@/type/user/points"

export async function getUserPoints(userId: string, storeId?: string): Promise<UserPointsSummary> {
    const rpcParams: any = { p_user_id: userId };
    if (storeId) {
        rpcParams.p_store_id = parseInt(storeId, 10);
    }

    const { data, error } = await supabase.rpc("get_user_points_summary", rpcParams);

    if (error) {
        console.error("error getting points summary from rpc", error);
        return { totalPoints: 0, spentPoints: 0, availablePoints: 0 };
    }

    if (data && data.length > 0) {
        const summary = data[0];
        return {
            totalPoints: summary.total_points || 0,
            spentPoints: summary.spent_points || 0,
            availablePoints: summary.available_points || 0
        };
    }

    return { totalPoints: 0, spentPoints: 0, availablePoints: 0 };
}

export async function getUserAvailablePoints(userId: string, storeId?: string): Promise<number> {
    const summary = await getUserPoints(userId, storeId);
    
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
        
    if (!activeCodesError && activeCodes) {
        const reservedPoints = activeCodes.reduce((sum, code) => sum + (code.points_cost || 0), 0);
        return Math.max(0, summary.availablePoints - reservedPoints);
    }
    
    return summary.availablePoints;
}

 


