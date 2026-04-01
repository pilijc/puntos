import { useState, useEffect, useCallback } from "react";
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

    const [retention, setRetention] = useState<RetentionData>({
        returningCount: 0,
        newCount: 0,
        returningPercent: 0,
        newPercent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [stampBuckets, setStampBuckets] = useState<StampBucket[]>([]);
    const [stampMaxStamps, setStampMaxStamps] = useState(0);

    const fetchMetrics = useCallback(async (showSkeleton = true) => {
        if (!storeId) return;
        if (showSkeleton) setLoading(true);

        try {
            const [metricsData, retentionData, stampDistData] = await Promise.all([
                getStoreMetrics(storeId, lat, lng, radius),
                getRetentionData(storeId),
                getStampDistribution(storeId),
            ]);

            setActiveUsers(metricsData.activeUsers);
            setTodayTransactions(metricsData.todayTransactions);
            setWeeklyActivity(metricsData.weeklyActivity);

            setRetention(retentionData);
            setStampBuckets(stampDistData.buckets);
            setStampMaxStamps(stampDistData.maxStamps);
        } catch (error) {
            console.error("Error fetching store dashboard metrics:", error);
        } finally {
            setLoading(false);
        }
    }, [storeId, lat, lng, radius]);

    useEffect(() => {
        if (storeId) {
            setLoading(true);
        }
    }, [storeId]);

    useEffect(() => {
        fetchMetrics(true);
    }, [fetchMetrics]);

    return {
        activeUsers,
        todayTransactions,
        weeklyActivity,
        retention,
        stampBuckets,
        stampMaxStamps,
        loading,
        refresh: fetchMetrics
    };
}