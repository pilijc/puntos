import { useCallback } from "react";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStreaks } from "@/hooks/use-streaks";
import { useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "@/hooks/user/rq/query-keys";

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
      console.log("[handleRefresh] start", { storeId, nearbyStoreIds });
      const wrap = (name: string, p: Promise<any>) => {
        console.log(`[handleRefresh] start ${name}`);
        return p.then((res) => {
          console.log(`[handleRefresh] resolved ${name}`);
          return res;
        }).catch((err) => {
          console.error(`[handleRefresh] error ${name}`, err);
          throw err;
        });
      };
      // Reset fetchedStoreIds so fetchRewardsData bypasses the stale-while-revalidate
      // guard and forces a fresh fetch of activeStreakProgramMap / upcomingStreakProgramMap.
      // Without this, a program that transitions upcoming → active stays stale until reload.
      resetRewardsData();

      const promises: Promise<any>[] = [
        wrap('refetchStamps', refetchStamps()),
        wrap('refetchStampRewards', refetchStampRewards()),
        wrap('refetchStreaks', refetchStreaks()),
      ];

      // Re-fetch streak/stamp program maps for the relevant stores
      if (nearbyStoreIds && nearbyStoreIds.length > 0) {
        const stampIds = storeId ? [Number(storeId)] : nearbyStoreIds;
        promises.push(wrap('fetchRewardsData', fetchRewardsData(nearbyStoreIds, stampIds)));
      }

      if (storeId) {
        promises.push(wrap('refetchActivityQueries', queryClient.invalidateQueries({ queryKey: activityKeys.root })));
      }

      await Promise.all(promises);
      console.log('[handleRefresh] all promises resolved');
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
      console.log('[handleRefresh] finished');
    }
  }, [setRefreshing, refetchStamps, refetchStampRewards, refetchStreaks, fetchBackendRewards, fetchRewardsData, resetRewardsData, queryClient]);

  return {
    handleRefresh,
  };
}
