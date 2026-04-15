import {supabase} from "@/supabase/supabase"
import {UserPointsSummary} from "@/type/user/points"

function sumPoints(arr: any[], key: string) {
  return arr?.reduce((sum, item) => sum + (item[key] ?? 0), 0) ?? 0;
}

export async function getUserPoints(userId: string): Promise<UserPointsSummary> {
const { data: purchases, error: purchasesError} = await supabase
    .from("purchases")
    .select("points_earned")
    .eq("user_id", userId);

    if(purchasesError){
        console.error("error getting pts from purchases");
        return;
    }

    const {data: streaks, error: streaksError} = await supabase
    .from("user_streaks")
    .select("points_earned")
    .eq("user_id", userId);

    if(streaksError){
        console.error("error getting points from streaks")
        return;
    }

    const {data: redemptions, error: redemptionsError} = await supabase
    .from("reward_redemptions")
    .select("points_spent")
    .eq("user_id", userId)

    if(redemptionsError){
        console.error("error getting pts from redemptions");
        return;
    }

    const purchasePoints = sumPoints(purchases, 'points_earned');
    const streakPoints = sumPoints(streaks, 'points_earned'); 
    const spentPoints = sumPoints(redemptions, 'points_spent');

    const totalPoints = purchasePoints + streakPoints;

    return{
        totalPoints,
        spentPoints,
        availablePoints: Math.max(0, totalPoints - spentPoints)
    };
}

export async function getUserAvailablePoints(userId: string): Promise<number>{
    const summary = await getUserPoints(userId);
    return summary.availablePoints;

}



