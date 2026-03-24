import { supabase } from "@/supabase/supabase";
import * as turf from "@turf/turf";

export async function getStoreMetrics(
    storeId: number,
    lat: number | null,
    lng: number | null,
    radiusMeters: number = 100
) {
    let activeUserCount = 0;
    let todayTxCount = 0;
    let weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    try {
        if (lat !== null && lng !== null) {
            const { data: users, error: userEr } = await supabase
                .from("user_settings")
                .select("latitude, longitude, user_roles!inner(role_id)")
                .is("deleted_at", null)
                .eq("location_enabled", true)
                .not("latitude", "is", null)
                .not("longitude", "is", null)
                .eq("user_roles.role_id", 4);
            
            if (!userEr && users) {
                const storePoint = turf.point([lng, lat]);
                users.forEach( u => {
                    const userPoint = turf.point([Number(u.longitude), Number(u.latitude)]);
                    const distanceKm = turf.distance(storePoint, userPoint, {units: 'kilometers'});
                    if (distanceKm <= (radiusMeters / 1000)) {
                        activeUserCount++;
                    }
                });
            }
        }

        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const { data: txData, error: txError } = await supabase
            .from("qr_transactions")
            .select("created_at, user_roles!inner(role_id)")
            .eq("store_id", storeId)
            .gte("created_at", sevenDaysAgo.toISOString())
            .eq("user_roles.role_id", 4);
        
        if (!txError && txData) {
            txData.forEach(tx => {
                const txDate = new Date(tx.created_at);
                txDate.setUTCHours(0, 0, 0, 0);
                
                const diffTime = startOfToday.getTime() - txDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays < 7) {
                    weeklyActivity[6 - diffDays]++;
                }
            });
            todayTxCount = weeklyActivity[6];
        }
    } catch (error) {
        console.error("Dashboard metrics error:", error);
    }

    return {
        activeUsers: activeUserCount,
        todayTransactions: todayTxCount,
        weeklyActivity: weeklyActivity
    }
}