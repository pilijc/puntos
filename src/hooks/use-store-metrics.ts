import { useState, useEffect } from "react";
import { getStoreMetrics } from "@/services/store-metrics-service";

export function useStoreDashboardMetrics(
    storeId: number,
    lat: number | null,
    lng: number | null,
    radius: number = 100
) {
    const [activeUsers, setActiveUsers] = useState(0);
    const [todayTransactions, setTodayTransactions] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchMetrics() {
            setLoading(true);

            const data = await getStoreMetrics(storeId, lat, lng, radius);

            if (isMounted) {
                setActiveUsers(data.activeUsers);
                setTodayTransactions(data.todayTransactions);
                setLoading(false);
            }
        }

        if (storeId) {
            fetchMetrics();
        }

        return () => { isMounted = false; };
    }, [storeId, lat, lng, radius]);

    return { activeUsers, todayTransactions, loading };
}