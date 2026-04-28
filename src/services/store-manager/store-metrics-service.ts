import { supabase } from "@/supabase/supabase";
import { RetentionData, StampBucket } from "@/type/store-manager/metric";

function getLocalDateRange(): { today: string; pastDate: string } {
    const now = new Date();

    //en-CA give YYYY-MM-DD format
    const todayStr = now.toLocaleDateString("en-CA");

    const pastDateObj = new Date(now);
    pastDateObj.setDate(pastDateObj.getDate() - 13); // 14 days including today
    const pastDateStr = pastDateObj.toLocaleDateString("en-CA");

    return { today: todayStr, pastDate: pastDateStr };
}

export async function getStoreMetrics(
    storeId: number,
    radiusMeters: number = 100
) {
    let activeUserCount = 0;
    let todayTxCount = 0;
    const activityData: import("@/type/store-manager/metric").ActivityChartData = {
        scans: Array(14).fill(0),
        unique_visitors: Array(14).fill(0),
        redemptions: Array(14).fill(0),
        new_members: Array(14).fill(0),
        points_earned: Array(14).fill(0),
    };

    try {
        const { data, error } = await supabase.rpc('get_users_near_store', {
            store_id_input: storeId,
            radius_metres: radiusMeters,
        });

        if (!error && data) {
            activeUserCount = data.length;
        }

        // weekly activity & todays scans
        const { today, pastDate } = getLocalDateRange();

        const { data: dailyData, error: dailyError } = await supabase
            .from("store_daily_metrics")
            .select("metric_date, scans_count, unique_visitors, redemptions_count, new_members_count, points_earned")
            .eq("store_id", storeId)
            .gte("metric_date", pastDate)
            .lte("metric_date", today)
            .order("metric_date", {ascending: true});

        if(!dailyError && dailyData) {
            //builds map for quick lookup
            const dataByDate: Record<string, any> = {};
            dailyData.forEach(row => {
                dataByDate[row.metric_date] = row;
            });

            const pastDateObj = new Date();
            pastDateObj.setDate(pastDateObj.getDate() - 13);

            for (let i = 0; i < 14; i++) {
                const dateObj = new Date(pastDateObj);
                dateObj.setDate(pastDateObj.getDate() + i);
                const dateStr = dateObj.toLocaleDateString("en-CA");
                
                const row = dataByDate[dateStr] || {};
                activityData.scans[i] = row.scans_count || 0;
                activityData.unique_visitors[i] = row.unique_visitors || 0;
                activityData.redemptions[i] = row.redemptions_count || 0;
                activityData.new_members[i] = row.new_members_count || 0;
                activityData.points_earned[i] = row.points_earned || 0;
            }

            todayTxCount = activityData.scans[13];
        }
    } catch (error) {
        console.error("Dashboard metrics error:", error);
    }

    return {
        activeUsers: activeUserCount,
        todayTransactions: todayTxCount,
        weeklyActivity: activityData,
    };
}

export async function getRetentionData(
    storeId: number,
): Promise<RetentionData> {
    const { data, error } = await supabase
        .from("store_user_loyalty")
        .select("purchase_count")
        .eq("store_id", storeId);

    if (error || !data) {
        console.error("Error fetching retention data:", error);
        return { returningCount: 0, newCount: 0, returningPercent: 0, newPercent: 0 };
    }

    const total = data.length;
    const returningCount = data.filter((row) => row.purchase_count > 1).length;
    const newCount = total - returningCount;

    const returningPercent = total > 0 ? Math.round((returningCount / total) * 100) : 0;
    const newPercent = total > 0 ? 100 - returningPercent : 0;

    return { returningCount, newCount, returningPercent, newPercent };
}

export async function getStampDistribution(
    storeId: number,
): Promise<{
    buckets: StampBucket[];
    maxStamps: number;
}> {
    const { data: programs, error: programError } = await supabase
        .from("store_stamps")
        .select("id, total_stamps")
        .eq("store_id", storeId)
        .eq("status", "active")
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

    const distinctValues = maxStamps;
    const targetBuckets = Math.min(distinctValues, 5);
    const segmentSize = Math.ceil(distinctValues / targetBuckets);

    const rawBuckets: { min: number; max: number; count: number }[] = [];
    let currentMin = 0;

    for (let i = 0; i < targetBuckets; i++) {
        const currentMax = i === 0 
            ? Math.max(0, segmentSize - 1) 
            : Math.min(currentMin + segmentSize - 1, maxStamps);
            
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

export async function getRecentTransactions(
    storeId: number, 
    limit: number = 10,
): Promise<any[]> {
    const { data, error } = await supabase
        .from('qr_transactions')
        .select(`
            id,
            created_at,
            points_earned,
            users:user_id (
                username,
                display_name
            )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        points_earned: row.points_earned,
        user: row.users || { username: 'Unknown', display_name: 'Unknown User' }
    }));
}