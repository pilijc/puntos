import { supabase } from "@/supabase/supabase";
import * as turf from "@turf/turf";
import { RetentionData, StampBucket } from "@/type/store-manager/metric";

function getLocalDateRange(): { today: string; sevenDaysAgo: string } {
    const now = new Date();

    //en-CA give YYYY-MM-DD format
    const todayStr = now.toLocaleDateString("en-CA");

    const sevenDaysAgoDate = new Date(now);
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgoDate.toLocaleDateString("en-CA");

    return { today: todayStr, sevenDaysAgo: sevenDaysAgoStr };
}

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

        // weekly activity & todays scans
        const { today, sevenDaysAgo } = getLocalDateRange();

        const { data: dailyData, error: dailyError } = await supabase
            .from("store_daily_metrics")
            .select("metric_date, scans_count")
            .eq("store_id", storeId)
            .gte("metric_date", sevenDaysAgo)
            .lte("metric_date", today)
            .order("metric_date", {ascending: true});

        if(!dailyError && dailyData) {
            //builds map for quick lookup {2026-03-30: 5, .....}
            const scansByDate: Record<string, number> = {};
            dailyData.forEach(row => {
                scansByDate[row.metric_date] = row.scans_count;
            });

            const sevenDaysAgoDate = new Date();
            sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);

            for (let i = 0; i < 7; i++) {
                const dateObj = new Date(sevenDaysAgoDate);
                dateObj.setDate(sevenDaysAgoDate.getDate() + i);
                const dateStr = dateObj.toLocaleDateString("en-CA");
                weeklyActivity[i] = scansByDate[dateStr] ?? 0;
            }

            todayTxCount = weeklyActivity[6];
        }
    } catch (error) {
        console.error("Dashboard metrics error:", error);
    }

    return {
        activeUsers: activeUserCount,
        todayTransactions: todayTxCount,
        weeklyActivity: weeklyActivity,
    };
}

export async function getRetentionData(storeId: number): Promise<RetentionData> {
    const { data, error } = await supabase
        .from("store_user_loyalty")
        .select("purchase_count")
        .eq("store_id", storeId);

    if (error || !data) {
        console.error("Error fetching retention data:", error);
        return { returningCount: 0, newCount: 0, returningPercent: 0, newPercent: 0 };
    }

    const total = data.length;
    const returningCount = data.filter(row => row.purchase_count > 1).length;
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

    // group into ~5 buckets based on maxStamps
    // split 0..maxStamps into equal segments
    const BUCKET_COUNT = maxStamps < 5 ? maxStamps : 5;
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