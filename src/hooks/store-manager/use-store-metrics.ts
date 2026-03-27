import { useState, useEffect } from "react";
import {
    getStoreMetrics,
    getRetentionData,
    getStampDistribution,
} from "@/services/store-manager/store-metrics-service";
import { RetentionData, StampBucket } from "@/type/store-manager/metric";

export function useStoreDashboardMetrics(
    storeId: number,
    lat: number | null,
    lng: number | null,
    radius: number = 100
) {
    const [activeUsers, setActiveUsers] = useState(0);
    const [todayTransactions, setTodayTransactions] = useState(0);
    const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [weeklyStampsActivity, setWeeklyStampsActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [retention, setRetention] = useState<RetentionData>({
        returningCount: 0,
        newCount: 0,
        returningPercent: 0,
        newPercent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [stampBuckets, setStampBuckets] = useState<StampBucket[]>([]);
    const [stampMaxStamps, setStampMaxStamps] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function fetchMetrics() {
            if (!storeId) return;
            setLoading(true);

            try {
                const [metricsData, retentionData, stampDistData] = await Promise.all([
                    getStoreMetrics(storeId, lat, lng, radius),
                    getRetentionData(storeId),
                    getStampDistribution(storeId),
                ]);

                if (isMounted) {
                    setActiveUsers(metricsData.activeUsers);
                    setTodayTransactions(metricsData.todayTransactions);
                    setWeeklyActivity(metricsData.weeklyActivity);
                    setWeeklyStampsActivity(metricsData.weeklyStampsActivity);
                    setRetention(retentionData);
                    setStampBuckets(stampDistData.buckets);
                    setStampMaxStamps(stampDistData.maxStamps);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching store dashboard metrics:", error);
                if (isMounted) setLoading(false);
            }
        }

        fetchMetrics();

        return () => { isMounted = false; };
    }, [storeId, lat, lng, radius]);

    return {
        activeUsers,
        todayTransactions,
        weeklyActivity,
        weeklyStampsActivity,
        retention,
        stampBuckets,
        stampMaxStamps,
        loading,
    };
}