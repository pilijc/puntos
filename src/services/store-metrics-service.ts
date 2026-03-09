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

    try{
        if (lat !== null && lng !== null) {
            const { data: users, error: userEr } = await supabase
                .from("user_settings")
                .select("latitude, longitude")
                .is("deleted_at", null)
                .eq("location_enabled", true)
                .not("latitude", "is", null)
                .not("longitude", "is", null);
            
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
        const { count, error: txError } = await supabase
            .from("qr_transaction")
            .select("*", {count: 'exact', head: true})
            .eq("store_id", storeId)
            .gte("create_at", startOfToday.toISOString());
        
            if (!txError && count !== null) {
                todayTxCount = count;
            }
    } catch (error) {
        console.error("Dashboard metrics error:", error);
    }

    return {
        activeUsers: activeUserCount,
        todayTransactions: todayTxCount
    }
}