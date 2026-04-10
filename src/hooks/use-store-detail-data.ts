import { rewards } from "@/data/rewards";
import { useLocation } from "@/hooks/user/use-location";
import { useStamps } from "@/hooks/use-stamps";
import { useStoreStore } from "@/store/user/store-store";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import {
  findStampByStoreId,
  getClaimableRewardState,
  getHasStampedToday,
  sortRewards,
} from "@/utils/store-helpers";
import { enrichStoresWithLocation } from "@/utils/store-location";
import { useMemo } from "react";

export function useStoreDetailData(storeId?: string) {
  const { location } = useLocation();
  const { stores } = useStoreStore();
  const { rewardSort, rewardPointsOrder } = useRewardsUiStore();
  const { stamps, isLoading: isStampsLoading } = useStamps();

  const storesWithLocation = useMemo(
    () => enrichStoresWithLocation(stores, location),
    [stores, location],
  );

  const store = useMemo(
    () => storesWithLocation.find((item) => item.id.toString() === storeId),
    [storesWithLocation, storeId],
  );

  const storeStampData = useMemo(
    () => findStampByStoreId(stamps, storeId),
    [stamps, storeId],
  );

  const hasStampedToday = useMemo(
    () => getHasStampedToday(storeStampData?.last_stamp_at),
    [storeStampData?.last_stamp_at],
  );

  const { hasClaimableReward, claimableRewardItem } = useMemo(
    () => getClaimableRewardState(storeStampData, rewards, storeId),
    [storeStampData, storeId],
  );

  const storeRewards = useMemo(() => {
    const filteredRewards = rewards.filter((reward) => reward.storeId === storeId);
    return sortRewards(filteredRewards, rewardSort, rewardPointsOrder);
  }, [rewardPointsOrder, rewardSort, storeId]);

  return {
    store,
    storeStampData,
    hasStampedToday,
    hasClaimableReward,
    claimableRewardItem,
    storeRewards,
    isStampsLoading,
  };
}
