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
        const { data, error } = await supabase.rpc('get_users_near_store', {
            store_id_input: storeId,
            radius_metres: radiusMeters,
        });

        if (!error && data) {
            activeUserCount = data.length;
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

    if (maxStamps <= 0) {
        return { buckets: [], maxStamps: 0 };
    }

    const distinctValues = maxStamps + 1;
    
    const targetBuckets = Math.min(distinctValues, 5);
    const segmentSize = Math.ceil(distinctValues / targetBuckets);

    const rawBuckets: { min: number; max: number; count: number }[] = [];
    let currentMin = 0;

    for (let i = 0; i < targetBuckets; i++) {
        const currentMax = Math.min(currentMin + segmentSize - 1, maxStamps);
        
        rawBuckets.push({ min: currentMin, max: currentMax, count: 0 });
        
        currentMin = currentMax + 1;
        if (currentMin > maxStamps) break;
    }

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