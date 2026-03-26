import { supabase } from "@/supabase/supabase";
import * as turf from "@turf/turf";
import { StoreTransaction, RetentionData, StampBucket } from "@/type/store-manager/metric"
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
            const { data: userLocs, error: locError } = await supabase
                .from("user_settings")
                .select(`
                    latitude, 
                    longitude, 
                    user:user_id!inner (
                        user_roles!inner ( role_id )
                    )
                `)
                .is("deleted_at", null)
                .eq("location_enabled", true)
                .not("latitude", "is", null)
                .not("longitude", "is", null)
                .eq("user.user_roles.role_id", 4);

            if (!locError && userLocs) {
                const storePoint = turf.point([lng, lat]);
                userLocs.forEach(u => {
                    const userPoint = turf.point([Number(u.longitude), Number(u.latitude)]);
                    const distanceKm = turf.distance(storePoint, userPoint, { units: 'kilometers' });
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
            .from("purchases")
            .select("created_at, user:user_id!inner( user_roles!inner(role_id) )")
            .eq("store_id", storeId)
            .gte("created_at", sevenDaysAgo.toISOString())
            .eq("user.user_roles.role_id", 4);
        
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
                stampDate.setUTCHours(0, 0, 0, 0);

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
    };
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

export async function getRetentionData(storeId: number): Promise<RetentionData> {
    const {data, error} = await supabase
        .from("purchases")
        .select("user_id")
        .eq("store_id", storeId)
        .not("user_id", "is", null);

    if (error || !data) {
        console.error("Error fetching retention data:", error);
        return {returningCount: 0, newCount: 0, returningPercent: 0, newPercent: 0};
    }

    const purchaseCounts: Record<string, number> = {};
    data.forEach((row) => {
        if (row.user_id) {
            purchaseCounts[row.user_id] = (purchaseCounts[row.user_id] ?? 0) + 1;
        }
    });

    const allUsers = Object.values(purchaseCounts);
    const total = allUsers.length;

    const returningCount = allUsers.filter((count) => count > 1).length;
    const newCount = total - returningCount;

    const returningPercent = total > 0 ? Math.round((returningCount / total) * 100) : 0;
    const newPercent = total > 0 ? 100 - returningPercent : 0;

     return { returningCount, newCount, returningPercent, newPercent };
}

export async function getStampDistribution(storeId: number): Promise<{
    buckets: StampBucket[];
    maxStamps: number;
}> {
    const { data: programs, error: programError } = await supabase
        .from("store_stamps")
        .select("id, total_stamps")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .limit(1);

    if (programError || !programs || programs.length === 0) {
        return {buckets: [], maxStamps: 0};
    }

    const program = programs[0];
    const maxStamps = program.total_stamps as number;

    const { data: progressData, error: progressError } = await supabase
        .from("stamp_progress")
        .select("stamps_count")
        .eq("stamp_program_id", program.id);

    if (progressError || !progressData) {
        return { buckets: [], maxStamps };
    }

    // group into ~4 buckets based on maxStamps
    // split 0..maxStamps into equal segments
    const BUCKET_COUNT = 4;
    const segmentSize = Math.ceil(maxStamps / BUCKET_COUNT);

    // initialize buckets
    const rawBuckets: { min: number; max: number; count: number }[] = [];
    for (let i = 0; i < BUCKET_COUNT; i++) {
        const min = i * segmentSize + (i === 0 ? 0 : 1);
        const max = Math.min((i + 1) * segmentSize, maxStamps);
        rawBuckets.push({ min, max, count: 0 });
    }

    // place each user's stamps_count into the right bucket
    progressData.forEach((row) => {
        const count = row.stamps_count as number;
        for (const bucket of rawBuckets) {
            if (count >= bucket.min && count <= bucket.max) {
                bucket.count++;
                break;
            }
        }
    });

    // format for chart
    const buckets: StampBucket[] = rawBuckets.map((b) => ({
        label: b.min === b.max ? `${b.min}` : `${b.min}–${b.max}`,
        count: b.count,
        maxStamps,
    }));

    return { buckets, maxStamps };
}