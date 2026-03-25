import { supabase } from "@/supabase/supabase";
import * as turf from "@turf/turf";
import { StoreTransaction } from "@/type/store-manager/metric"

export async function getStoreMetrics(
    storeId: number,
    lat: number | null,
    lng: number | null,
    radiusMeters: number = 100
) {
    let activeUserCount = 0;
    let todayTxCount = 0;
    let weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    let weeklyStampsActivity = [0, 0, 0, 0, 0, 0, 0];
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
            // .eq("user_roles.role_id", 4);
        
        if (!txError && txData) {
            txData.forEach(tx => {
                const txDate = new Date(tx.created_at);
                txDate.setUTCHours(0, 0, 0, 0);
                
                const diffTime = startOfToday.getTime() - txDate.getTime();
                const diffDays = Math.floor((diffTime / (1000 * 60 * 60 * 24)) + 0.1);
                
                if (diffDays >= 0 && diffDays < 7) {
                    weeklyActivity[6 - diffDays]++;
                }
            });
            todayTxCount = weeklyActivity[6];
        }

        const { data: stampData, error: stampError } = await supabase
            .from("stamp_events")
            .select("created_at")
            .eq("store_id", storeId)
            .gte("created_at", sevenDaysAgo.toISOString());
        
        if (!stampError && stampData) {
            stampData.forEach(stamp => {
                const stampDate = new Date(stamp.created_at);
                stampDate.setUTCHours(0,0,0,0);

                const diffTime = startOfToday.getTime() - stampDate.getTime();
                const diffDays = Math.floor((diffTime / (1000 * 60 * 60 * 24)) + 0.1);

                if (diffDays >= 0 && diffDays < 7) {
                    weeklyStampsActivity[6 - diffDays]++;
                }
            });
        }

    } catch (error) {
        console.error("Dashboard metrics error:", error);
    }

    return {
        activeUsers: activeUserCount,
        todayTransactions: todayTxCount,
        weeklyActivity: weeklyActivity,
        weeklyStampsActivity: weeklyStampsActivity
    }
}

export async function getRecentTransactions(storeId: number): Promise<StoreTransaction[]> {
    const { data, error } = await supabase
        .from("qr_transactions")
        .select(`id, points_earned, created_at, user:user_id ( name ), staff:store_staff_id (name )`)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        points_earned: t.points_earned,
        created_at: t.created_at,
        user_name: t.user?.name || "Unknown User",
        staff_name: t.staff?.name || "Unknown Staff",
    }))    
}