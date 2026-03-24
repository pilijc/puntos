import type { RewardItem } from "@/data/rewards";
import type { UserLocation } from "@/services/location-service";
import type { PointsOrder, RewardSortOrder } from "@/services/reward-service";
import type { StampProgress } from "@/services/stamp-service";
import type { Store } from "@/type/user/store";
import { enrichStoresWithLocation } from "@/utils/store-location";

export type StampedStoreListItem = {
  id: string;
  name: string;
  location: string;
  distanceMeters: number;
  stampsCount: number;
  targetStamps: number;
  isNearby: boolean;
  logo: string | null;
};

export function sortRewards<T extends {
  points?: number;
  points_cost?: number;
  popularity?: number;
  createdAt?: string;
  created_at?: string;
}>(items: T[], sortBy: RewardSortOrder, pointsOrder: PointsOrder): T[] {
  const sorted = [...items];

  if (sortBy === "points") {
    sorted.sort((a, b) => {
      const aPoints = a.points ?? a.points_cost ?? 0;
      const bPoints = b.points ?? b.points_cost ?? 0;
      return pointsOrder === "desc" ? bPoints - aPoints : aPoints - bPoints;
    });
    return sorted;
  }

  if (sortBy === "newest") {
    sorted.sort((a, b) => {
      const aCreated = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
      const bCreated = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
      return bCreated - aCreated;
    });
    return sorted;
  }

  sorted.sort((a, b) => (a.popularity ?? 0) - (b.popularity ?? 0));
  return sorted;
}

export function getHasStampedToday(lastStampAt?: string | null): boolean {
  if (!lastStampAt) return false;

  const lastStampDate = new Date(lastStampAt);
  const today = new Date();

  return (
    lastStampDate.getFullYear() === today.getFullYear() &&
    lastStampDate.getMonth() === today.getMonth() &&
    lastStampDate.getDate() === today.getDate()
  );
}

export function getStampStats(stamps: StampProgress[]) {
  return {
    activeStamps: stamps.length,
    highestStampCount:
      stamps.length > 0 ? Math.max(...stamps.map((stamp) => stamp.stamps_count)) : 0,
  };
}

export function findStampByStoreId(
  stamps: StampProgress[],
  storeId?: string,
): StampProgress | undefined {
  if (!storeId) return undefined;
  return stamps.find((stamp) => stamp.store_id?.toString() === storeId);
}

export function getClaimableRewardState(
  stampData: StampProgress | undefined,
  availableRewards: RewardItem[],
  storeId?: string,
) {
  const hasClaimableReward = Boolean(
    stampData && stampData.stamps_count >= stampData.target,
  );

  const claimableRewardItem = availableRewards.find((reward) => reward.storeId === storeId)
    ?? availableRewards[0]
    ?? null;

  return {
    hasClaimableReward,
    claimableRewardItem,
  };
}

export function buildStampedStoreList(
  stores: Store[],
  stamps: StampProgress[],
  location: UserLocation | null,
  locationFallback = "Unknown location",
  stampRewards: any[] = [],
  activeStampProgramRewards: any[] = []
): StampedStoreListItem[] {
  const stampedIds = new Set(stamps.map((stamp) => stamp.store_id.toString()));
  const enrichedStores = enrichStoresWithLocation(stores, location);

  const visibleStores = enrichedStores.filter((store) => 
    stampedIds.has(store.id.toString()) || store.isNearby
  );

  return visibleStores.map((store) => {
    const stampData = stamps.find(
      (stamp) => stamp.store_id.toString() === store.id.toString(),
    );

    const stampReward = stampRewards?.find((s) => s.store_id?.toString() === store.id.toString());
    const activeProgramReward = activeStampProgramRewards?.find(
      (program) => program.store_id?.toString() === store.id.toString()
    );

    const target = Math.max(
      activeProgramReward?.total_stamps ?? stampReward?.target_stamps ?? stampData?.target ?? 7,
      1
    );

    const count = stampData?.stamps_count ?? stampReward?.current_stamp_count ?? 0;

    return {
      id: store.id.toString(),
      name: store.name,
      location: store.address || locationFallback,
      distanceMeters: store.distanceMeters,
      stampsCount: count,
      targetStamps: target,
      isNearby: store.isNearby,
      logo: store.logo,
    };
  });
}
