import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { useStamps } from "@/hooks/use-stamps";
import { useCallback } from "react";

export function useStoreDetailActions(storeId?: string) {
  const {
    refreshing,
    setRefreshing,
  } = useRewardsUiStore();
  const { refetch: refetchStamps } = useStamps();
  const { refetch: refetchStampRewards } = useStampRewards();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStamps(), refetchStampRewards()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStampRewards, refetchStamps, setRefreshing]);

  return {
    refreshing,
    onRefresh,
  };
}
