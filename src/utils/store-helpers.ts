import type { RewardItem } from "@/data/rewards";
import type { UserLocation } from "@/services/user/location-service";
import type { PointsOrder, RewardSortOrder } from "@/services/reward-service";
import type { StampProgress } from "@/services/stamp-service";
import type { Store } from "@/type/user/store";
import type { UserStreak } from "@/services/streak-service";
import { enrichStoresWithLocation } from "@/utils/store-location";

/**
 * ============================================================================
 * store-helpers.ts — Store List Data Builder
 * ============================================================================
 *
 * This file owns the logic that converts raw Supabase data into display-ready
 * `StampedStoreListItem` objects used by the store list FlatList and its items.
 *
 * ⚠️  AI / DEV WARNING — READ BEFORE EDITING
 *
 * 1. DATA SOURCES: Stamp & streak data come from MULTIPLE sources depending on
 *    what the user has done and how far they are from the store.
 *    DO NOT simplify the fallback chains — each source covers a different case:
 *
 *    stampEnabled sources (in priority order):
 *      a. activeStampProgramRewards  — fetched for NEARBY stores via use-rewards-data
 *      b. stampRewards               — fetched for NEARBY stores (legacy fallback)
 *      c. stampData (stamp_progress) — covers JOINED non-nearby stores.
 *                                       getUserStamps() already filters stamp_enabled=false
 *                                       rows, so presence of stampData IS proof of enablement.
 *      d. storeFeatureFlags          — covers DISCOVER stores with no user history.
 *                                       Fetched as a batch query for ALL stores on focus.
 *    ⚠️  DO NOT remove any of these four sources — removing one will break chevron
 *         visibility for at least one section (nearby / joined / discover).
 *
 *    streakProgramActive sources (in priority order):
 *      a. userStreaks (user has started the streak)
 *      b. activeStreakStoreIds (eligibleStreakStoreIds from use-rewards-data for nearby)
 *      c. storeFeatureFlags.streak_enabled (covers ALL stores via the batch fetch)
 *    ⚠️  DO NOT remove source (c) — it is the only way discover stores show chevron.
 *
 * 2. COUNT SOURCE: stampsCount uses ONLY stamp_progress.stamps_count.
 *    stamp_rewards.current_stamp_count is intentionally EXCLUDED because it is
 *    only updated by the legacy addStamp() path and is STALE for stamps issued
 *    via the issueStampForPurchase RPC.
 *
 * 3. streakTarget FALLBACK: When a user hasn’t started the streak yet (no
 *    user_streaks row), streakTarget falls back to activeStreakProgramMap.streak_length.
 *    This prevents the ’0/?’ display. DO NOT remove this fallback.
 * ============================================================================
 */

export type StampedStoreListItem = {
  id: string;
  name: string;
  location: string;
  distanceMeters: number;
  stampsCount: number;
  targetStamps: number;
  isNearby: boolean;
  logo: string | null;
  isJoined: boolean;
  /** false = store has no active stamp program → show placeholder */
  stampEnabled: boolean;
  /** true = store has an active streak program (user may not have started yet) */
  streakProgramActive: boolean;
  /** null only when streakProgramActive is false */
  streakDays: number | null;
  streakTarget: number | null;
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
  const claimableRewardItem =
    availableRewards.find((reward) => reward.storeId === storeId) ??
    availableRewards[0] ??
    null;
  return { hasClaimableReward, claimableRewardItem };
}

export function buildStampedStoreList(
  stores: Store[],
  stamps: StampProgress[],
  location: UserLocation | null,
  locationFallback = "Unknown location",
  stampRewards: any[] = [],
  activeStampProgramRewards: any[] = [],
  userStreaks: UserStreak[] = [],
  /** Store IDs known to have an active streak program */
  activeStreakStoreIds: Set<number> = new Set(),
  /** storeId → full active streak program — used to get streak_length when user hasn't started */
  activeStreakProgramMap: Map<number, { streak_length?: number | null }> = new Map(),
  /** storeId → store_feature flags (stamp_enabled / streak_enabled) — covers ALL stores for chevron visibility */
  storeFeatureFlags: Map<number, { stamp_enabled: boolean; streak_enabled: boolean }> = new Map(),
): StampedStoreListItem[] {
  const stampedIds = new Set(stamps.map((stamp) => stamp.store_id.toString()));
  const enrichedStores = enrichStoresWithLocation(stores, location);

  return enrichedStores.map((store) => {
    const storeIdStr = store.id.toString();
    const isJoined = stampedIds.has(storeIdStr);

    const stampData = stamps.find((s) => s.store_id.toString() === storeIdStr);
    const stampReward = stampRewards?.find((s) => s.store_id?.toString() === storeIdStr);
    const activeProgramReward = activeStampProgramRewards?.find(
      (p) => p.store_id?.toString() === storeIdStr,
    );

    const target = Math.max(
      activeProgramReward?.total_stamps ?? stampReward?.target_stamps ?? stampData?.target ?? 7,
      1,
    );
    // stamp_progress.stamps_count is the canonical source of truth.
    // stamp_rewards.current_stamp_count is NOT used here — it is only updated
    // by the legacy addStamp() path and will be 0/stale for stamps issued
    // via the issueStampForPurchase RPC.
    const count = stampData?.stamps_count ?? 0;

    // Streak: match on store_id with an active program or in-progress user row
    const streak = userStreaks.find(
      (s) =>
        s.store_id?.toString() === storeIdStr &&
        (s.store_streaks?.status === "active" || s.status === "in_progress"),
    );
    // streakTarget fallback chain (in priority order):
    //   1. user's own streak row       — most accurate, user has started
    //   2. activeStreakProgramMap       — ALL stores (populated by useFocusEffect in store/index.tsx
    //                                     AND by fetchRewardsData from the detail screen)
    // ⚠️  DO NOT add a 3rd raw-query fallback here. Fix the source in useFocusEffect instead.
    const streakTarget =
      streak?.store_streaks?.streak_length ??
      activeStreakProgramMap.get(Number(storeIdStr))?.streak_length ??
      null;
    const rawStreakDays = streak != null
      ? (streak.total_earned_days ?? streak.streak_days ?? 0)
      : null;
    const streakDays = rawStreakDays !== null
      ? Math.min(Math.max(0, rawStreakDays), streakTarget ?? Infinity)
      : null;

    // streakProgramActive: true when the store has an active streak program,
    // regardless of whether the user has started it yet.
    // Sources (in priority):
    //   1. user has a streak row here (program definitely active or was active)
    //   2. store is in activeStreakStoreIds (eligibleStreakStoreIds from nearby check)
    //   3. store_feature.streak_enabled via storeFeatureFlags (covers discover stores)
    const featureFlags = storeFeatureFlags.get(Number(storeIdStr));
    const streakProgramActive =
      streak != null ||
      activeStreakStoreIds.has(Number(storeIdStr)) ||
      featureFlags?.streak_enabled === true;

    // stampEnabled: true when the store has an active stamp program.
    // Sources (in priority):
    //   1. activeProgramReward  — fetched for nearby stores
    //   2. stampReward          — fetched for nearby stores (fallback)
    //   3. stampData            — user has stamp_progress (joined stores)
    //   4. store_feature.stamp_enabled via storeFeatureFlags (covers discover stores)
    const stampEnabled =
      !!(activeProgramReward || stampReward || stampData) ||
      featureFlags?.stamp_enabled === true;

    return {
      id: storeIdStr,
      name: store.name,
      location: store.address || locationFallback,
      distanceMeters: store.distanceMeters,
      stampsCount: count,
      targetStamps: target,
      isNearby: store.isNearby,
      logo: store.logo,
      isJoined,
      stampEnabled,
      streakProgramActive,
      streakDays: streakProgramActive ? (streakDays ?? 0) : null,
      streakTarget: streakProgramActive ? (streakTarget ?? null) : null,
    };
  });
}
