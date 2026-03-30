import { useState, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useDashboardStore } from "@/store/dashboard-store";
import { useProfile } from "@/hooks/use-profile";

export function useSuperAdminDashboard() {
  const router = useRouter();
  const { users, stores, adminInfo, loading, fetchDashboardData, fetchAdminSession } = useDashboardStore();
  const { profile, refreshProfile } = useProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const activeStoresCount = useMemo(() =>
    (stores || []).filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length,
    [stores]
  );

  const initData = async () => {
    await Promise.all([fetchAdminSession(), fetchDashboardData()]);
  };

  useFocusEffect(
    useCallback(() => {
      initData();
      refreshProfile();
      setAvatarKey(Date.now());
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await initData();
    setRefreshing(false);
  };

  return {
    router,
    users,
    stores,
    adminInfo,
    loading,
    profile,
    refreshing,
    avatarKey,
    activeStoresCount,
    onRefresh,
  };
}
