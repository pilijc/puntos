import type { Reward } from "@/services/reward-service";
import type { RewardItem, RewardStatus } from "@/data/rewards";

export function mapBackendRewardToRewardItem(
  backendReward: Reward,
  userPoints: number
): RewardItem {
  const status: RewardStatus = 
    userPoints >= backendReward.points_cost ? "redeem" : "insufficient";

  return {
    id: backendReward.id.toString(),
    storeId: backendReward.store_id.toString(),
    title: backendReward.title,
    desc: backendReward.description,
    imageUrl: backendReward.image_url || undefined,
    points: backendReward.points_cost,
    status,
    popularity: 0,
    createdAt: backendReward.created_at,
  };
}

export function mapBackendRewardsToRewardItems(
  backendRewards: Reward[],
  userPoints: number
): RewardItem[] {
  return backendRewards.map(reward => 
    mapBackendRewardToRewardItem(reward, userPoints)
  );
}