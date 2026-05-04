import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Platform, ScrollView as RNScrollView, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";

import { useManagerStoresStore } from "@/store/manager-stores-store";
import { getStoreMetrics, getRetentionData, getStampDistribution, getRecentTransactions } from "@/services/store-manager/store-metrics-service";
import { RecentTransaction, RetentionData, StampBucket, ActivityChartData } from "@/type/store-manager/metric";
import { getLast7Labels, getWeekDateRange, getLast14Labels, get14DayDateRange } from "@/utils/date-helpers";

export function useStoreDashboard() {
    const { width, height } = useWindowDimensions();
    const isWeb = Platform.OS === "web" && width > 768 && height > 600;
    const metricScrollRef = useRef<RNScrollView>(null);
    
    const {
        stores,
        isFetching: refreshing,
        fetchStores: refresh,
    } = useManagerStoresStore();

    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const task = setTimeout(() => refresh(true), 0);
            return () => clearTimeout(task);
        }, [refresh]),
    );

    useEffect(() => {
        if (!selectedStoreId && stores.length > 0) {
            setSelectedStoreId(stores[0].id);
        }
    }, [stores, selectedStoreId]);

    const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

    // Metrics state
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
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [stampBuckets, setStampBuckets] = useState<StampBucket[]>([]);
    const [stampMaxStamps, setStampMaxStamps] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])

    const fetchMetrics = useCallback(async (showSkeleton = true) => {
        const storeId = selectedStore?.id ?? 0;
        const radius = selectedStore?.radius ?? 100;

        if (!storeId) return;
        if (showSkeleton) setMetricsLoading(true);

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
            setMetricsLoading(false);
        }
    }, [selectedStore?.id, selectedStore?.radius]);

    useEffect(() => {
        fetchMetrics(true);
    }, [fetchMetrics]);

    const handleRefresh = useCallback(async () => {
        await Promise.all([refresh(true), fetchMetrics(false)]);
    }, [refresh, fetchMetrics]);

    const dayLabels = useMemo(() => isWeb ? getLast14Labels() : getLast7Labels(), [isWeb]);
    const weekRange = useMemo(() => isWeb ? get14DayDateRange() : getWeekDateRange(), [isWeb]);

    const displayActivity = useMemo(() => {
        if (isWeb) return weeklyActivity;
        return {
            scans: weeklyActivity?.scans?.slice(-7) || [],
            unique_visitors: weeklyActivity?.unique_visitors?.slice(-7) || [],
            redemptions: weeklyActivity?.redemptions?.slice(-7) || [],
            new_members: weeklyActivity?.new_members?.slice(-7) || [],
        };
    }, [weeklyActivity, isWeb]);

    const [containerWidth, setContainerWidth] = useState(0);
    const [scrollIndex, setScrollIndex] = useState(0);
    const ITEM_GAP = 16;
    const TILE_WIDTH = 260 + ITEM_GAP; 

    const handleMetricScroll = useCallback((direction: 'left' | 'right') => {
        let newIndex = direction === 'left' ? scrollIndex - 1 : scrollIndex + 1;
        newIndex = Math.max(0, Math.min(newIndex, 3)); 
        setScrollIndex(newIndex);
        metricScrollRef.current?.scrollTo({ x: newIndex * TILE_WIDTH, animated: true });
    }, [scrollIndex, TILE_WIDTH]);

    return {
        isWeb,
        stores,
        selectedStore,
        selectedStoreId,
        setSelectedStoreId,
        isDropdownVisible,
        setDropdownVisible,
        refreshing,
        handleRefresh,
        activeUsers,
        todayTransactions,
        retention,
        stampBuckets,
        stampMaxStamps,
        recentTransactions,
        metricsLoading,
        dayLabels,
        weekRange,
        displayActivity,
        containerWidth,
        setContainerWidth,
        scrollIndex,
        handleMetricScroll,
        metricScrollRef,
    };
}