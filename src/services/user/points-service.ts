import {supabase} from "@/supabase/supabase"
import {UserPointsSummary} from "@/type/user/points"

function sumPoints(arr: any[], key: string) {
  return arr?.reduce((sum, item) => sum + (item[key] ?? 0), 0) ?? 0;
}

export async function getUserPoints(userId: string, storeId?: string): Promise<UserPointsSummary> {
 
    let purchasesQuery = supabase
        .from("purchases")
        .select("points_earned")
        .eq("user_id", userId);
    
    let streaksQuery = supabase
        .from("user_streaks")
        .select("points_earned")
        .eq("user_id", userId);
    
    let redemptionsQuery = supabase
        .from("reward_redemptions")
        .select("points_spent")
        .eq("user_id", userId);

    //store filtering, points by specific store
    if (storeId) {
        purchasesQuery = purchasesQuery.eq("store_id", storeId);
        streaksQuery = streaksQuery.eq("store_id", storeId);
        redemptionsQuery = redemptionsQuery.eq("store_id", storeId);
    }

    const { data: purchases, error: purchasesError } = await purchasesQuery;
    if (purchasesError) {
        console.error("error getting pts from purchases", purchasesError);
        return { totalPoints: 0, spentPoints: 0, availablePoints: 0 };
    }

    const { data: streaks, error: streaksError } = await streaksQuery;
    if (streaksError) {
        console.error("error getting points from streaks", streaksError);
        return { totalPoints: 0, spentPoints: 0, availablePoints: 0 };
    }

    const { data: redemptions, error: redemptionsError } = await redemptionsQuery;
    if (redemptionsError) {
        console.error("error getting pts from redemptions", redemptionsError);
        return { totalPoints: 0, spentPoints: 0, availablePoints: 0 };
    }

    const purchasePoints = sumPoints(purchases, 'points_earned');
    const streakPoints = sumPoints(streaks, 'points_earned');
    const spentPoints = sumPoints(redemptions, 'points_spent');

    const totalPoints = purchasePoints + streakPoints;

    return {
        totalPoints,
        spentPoints,
        availablePoints: Math.max(0, totalPoints - spentPoints)
    };
}

export async function getUserAvailablePoints(userId: string, storeId?: string): Promise<number> {
    const summary = await getUserPoints(userId, storeId);
    return summary.availablePoints;
}

 


