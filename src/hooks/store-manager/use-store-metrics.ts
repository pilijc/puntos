import { useState, useEffect, useCallback } from "react";
import { getStoreMetrics, getRetentionData, getStampDistribution, getRecentTransactions } from "@/services/store-manager/store-metrics-service";
import { RecentTransaction, RetentionData, StampBucket, ActivityChartData } from "@/type/store-manager/metric";

export function useStoreDashboardMetrics(
    storeId: number,
    radius: number = 100
) {
    const [activeUsers, setActiveUsers] = useState(0);
    const [todayTransactions, setTodayTransactions] = useState(0);
    const [weeklyActivity, setWeeklyActivity] = useState<ActivityChartData>({
        scans: Array(14).fill(0),
        unique_visitors: Array(14).fill(0),
        redemptions: Array(14).fill(0),
        new_members: Array(14).fill(0),
    });
    
    const [retention, setRetention] = useState<RetentionData>({
        returningCount: 0,
        newCount: 0,
        returningPercent: 0,
        newPercent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [stampBuckets, setStampBuckets] = useState<StampBucket[]>([]);
    const [stampMaxStamps, setStampMaxStamps] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])

    const fetchMetrics = useCallback(async (showSkeleton = true) => {
        if (!storeId) return;
        if (showSkeleton) setLoading(true);

        try {
            const [metricsData, retentionData, stampDistData, recentTxs] = await Promise.all([
                getStoreMetrics(storeId, radius),
                getRetentionData(storeId),
                getStampDistribution(storeId),
                getRecentTransactions(storeId, 10)
            ]);

            setActiveUsers(metricsData.activeUsers);
            setTodayTransactions(metricsData.todayTransactions);
            setWeeklyActivity(metricsData.weeklyActivity);
            setRetention(retentionData);
            setStampBuckets(stampDistData.buckets);
            setStampMaxStamps(stampDistData.maxStamps);
            setRecentTransactions(recentTxs);
        } catch (error) {
            console.error("Error fetching store dashboard metrics:", error);
        } finally {
            setLoading(false);
        }
    }, [storeId, radius]);

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
        recentTransactions,
        loading,
        refresh: fetchMetrics
    };
}