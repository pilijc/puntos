import { useState, useEffect } from "react";
import { getStoreMetrics, getRecentTransactions } from "@/services/store-manager/store-metrics-service";
import { StoreTransaction } from "@/type/store-manager/metric";

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
    const [recentTransactions, setRecentTransactions] = useState<StoreTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchMetrics() {
            if (!storeId) return;
            setLoading(true);

            try {
                const [metricsData, transactionsData] = await Promise.all([
                    getStoreMetrics(storeId, lat, lng, radius),
                    getRecentTransactions(storeId)
                ]);

                if (isMounted) {
                    setActiveUsers(metricsData.activeUsers);
                    setTodayTransactions(metricsData.todayTransactions);
                    setWeeklyActivity(metricsData.weeklyActivity);
                    setWeeklyStampsActivity(metricsData.weeklyStampsActivity);
                    setRecentTransactions(transactionsData);
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
        recentTransactions,
        loading 
    };
}