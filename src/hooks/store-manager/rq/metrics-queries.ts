import { useQuery } from "@tanstack/react-query";
import {
  getRecentTransactions,
  getRetentionData,
  getStampDistribution,
  getStoreMetrics,
} from "@/services/store-manager/store-metrics-service";
import { storeManagerKeys } from "./query-keys";

export type DashboardBundle = {
  metricsData: Awaited<ReturnType<typeof getStoreMetrics>>;
  retentionData: Awaited<ReturnType<typeof getRetentionData>>;
  stampDistData: Awaited<ReturnType<typeof getStampDistribution>>;
  recentTxs: Awaited<ReturnType<typeof getRecentTransactions>>;
};

async function fetchDashboardBundle(storeId: number): Promise<DashboardBundle> {
  const [metricsData, retentionData, stampDistData, recentTxs] = await Promise.all([
    getStoreMetrics(storeId),
    getRetentionData(storeId),
    getStampDistribution(storeId),
    getRecentTransactions(storeId, 10),
  ]);
  return { metricsData, retentionData, stampDistData, recentTxs };
}

export function useStoreDashboardBundleQuery(storeId: number | null | undefined) {
  return useQuery({
    queryKey:
      storeId != null && storeId > 0
        ? storeManagerKeys.dashboardBundle(storeId)
        : ["store-manager", "dashboard-bundle", "disabled"],
    queryFn: () => fetchDashboardBundle(storeId!),
    enabled: storeId != null && storeId > 0,
    staleTime: 30_000,
  });
}
