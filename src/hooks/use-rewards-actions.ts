import { useCallback } from "react";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStreaks } from "@/hooks/use-streaks";

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

  const handleRefresh = useCallback(async (storeId?: string, nearbyStoreIds?: number[]) => {
    setRefreshing(true);
    try {
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

      // If we are on a store details page, also refresh backend rewards
      if (storeId) {
        promises.push(fetchBackendRewards({
          storeId,
          sortBy: rewardSort,
          pointsOrder: rewardPointsOrder,
        }));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [setRefreshing, refetchStamps, refetchStampRewards, refetchStreaks, fetchBackendRewards, fetchRewardsData, resetRewardsData, rewardSort, rewardPointsOrder]);

  return {
    handleRefresh,
  };
}
