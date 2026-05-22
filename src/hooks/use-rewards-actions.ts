import { useCallback } from "react";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStreaks } from "@/hooks/use-streaks";
import { useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "@/hooks/user/rq/query-keys";
import { logger } from "@/utils/logger";

export function useRewardsActions() {
  const {
    setRefreshing,
    rewardSort,
    rewardPointsOrder,
  } = useRewardsUiStore();

  const { fetchBackendRewards, fetchRewardsData, fetchedStoreIds, reset: resetRewardsData } = useRewardsDataStore();
  const { refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();
  const { refetch: refetchStreaks } = useStreaks();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async (storeId?: string, nearbyStoreIds?: number[]) => {
    setRefreshing(true);
    try {
      logger.debug("[handleRefresh] start", { storeId, nearbyStoreIds });
      const wrap = (name: string, p: Promise<any>) => {
        logger.debug(`[handleRefresh] start ${name}`);
        return p.then((res) => {
          logger.debug(`[handleRefresh] resolved ${name}`);
          return res;
        }).catch((err) => {
          logger.error(`[handleRefresh] error ${name}`, err);
          throw err;
        });
      };
      // Reset fetchedStoreIds so fetchRewardsData bypasses the stale-while-revalidate
      // guard and forces a fresh fetch of activeStreakProgramMap / upcomingStreakProgramMap.
      // Without this, a program that transitions upcoming → active stays stale until reload.
      resetRewardsData();

      const promises: Promise<any>[] = [
        refetchStamps(),
        refetchStampRewards(),
        refetchStreaks(),
      ];

      // Re-fetch streak/stamp program maps for the relevant stores
      if (nearbyStoreIds && nearbyStoreIds.length > 0) {
        const stampIds = storeId ? [Number(storeId)] : nearbyStoreIds;
        promises.push(fetchRewardsData(nearbyStoreIds, stampIds));
      }

      if (storeId) {
        promises.push(queryClient.invalidateQueries({ queryKey: activityKeys.root }));
      }

      await Promise.all(promises);
      logger.debug('[handleRefresh] all promises resolved');
    } catch (error) {
      logger.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
      logger.debug('[handleRefresh] finished');
    }
  }, [setRefreshing, refetchStamps, refetchStampRewards, refetchStreaks, fetchBackendRewards, fetchRewardsData, resetRewardsData, queryClient]);

  return {
    handleRefresh,
  };
}
