import { useCallback } from "react";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useRewardsDataStore } from "@/hooks/use-rewards-data";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";

export function useRewardsActions() {
  const {
    setRefreshing,
    rewardSort,
    rewardPointsOrder,
  } = useRewardsUiStore();

  const { fetchBackendRewards } = useRewardsDataStore();
  const { refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const handleRefresh = useCallback(async (storeId?: string) => {
    setRefreshing(true);
    try {
      const promises: Promise<any>[] = [refetchStamps(), refetchStampRewards()];

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
  }, [setRefreshing, refetchStamps, refetchStampRewards, fetchBackendRewards, rewardSort, rewardPointsOrder]);

  return {
    handleRefresh,
  };
}
