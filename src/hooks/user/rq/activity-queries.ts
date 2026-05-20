import { useQuery } from "@tanstack/react-query";
import { activityKeys } from "./query-keys";
import { getUserAvailablePoints } from "@/services/user/points-service";
import { getUserTransactionHistory } from "@/services/user/qr-service";
import { getRewards, RewardSortOrder, PointsOrder } from "@/services/reward-service";

export function useUserStorePointsQuery(userId: string | undefined, storeId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.points(userId ?? "", storeId ?? ""),
    queryFn: async () => {
      if (!userId || !storeId) return 0;
      return await getUserAvailablePoints(userId, storeId);
    },
    enabled: !!userId && !!storeId,
  });
}

export function useUserTransactionsQuery(userId: string | undefined, storeId: string | undefined, limit: number = 3) {
  return useQuery({
    queryKey: activityKeys.transactions(userId ?? "", storeId ?? ""),
    queryFn: async () => {
      if (!userId || !storeId) return [];
      return await getUserTransactionHistory(userId, storeId, limit);
    },
    enabled: !!userId && !!storeId,
  });
}

export function useStoreRewardsQuery(
  storeId: string | undefined,
  sortBy: RewardSortOrder,
  pointsOrder: PointsOrder,
  limit: number = 20
) {
  return useQuery({
    queryKey: activityKeys.storeRewards(storeId ?? "", sortBy, pointsOrder),
    queryFn: async () => {
      if (!storeId) return [];
      return await getRewards({
        storeId,
        sortBy,
        pointsOrder,
        limit,
      });
    },
    enabled: !!storeId,
  });
}
