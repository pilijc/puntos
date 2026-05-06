import { supabase } from "@/supabase/supabase";

export async function getRewardRedemptionHistory(userId: string): Promise<any[]> {
  try {
    // Fetch reward redemptions
    const { data: redemptions, error } = await supabase
      .from('reward_redemptions')
      .select(`
        id,
        points_spent,
        created_at,
        store_id,
        reward_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Get store names
    const storeIds = [...new Set(redemptions.map(r => r.store_id).filter(id => id != null))];
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    // Get reward data
    const rewardIds = [...new Set(redemptions.map(r => r.reward_id).filter(id => id != null))];
    const { data: rewards, error: rewardsError } = await supabase
      .from('store_rewards')
      .select('id, title, image_url')
      .in('id', rewardIds);

    // Create store lookup map
    const storeMap = (stores || []).reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {});

    // Create reward lookup map
    const rewardMap = (rewards || []).reduce((acc, reward) => {
      acc[reward.id] = reward;
      return acc;
    }, {});

    // Format the data for the UI
    return redemptions.map((redemption: any) => {
      const reward = rewardMap[redemption.reward_id];
      return {
        id: redemption.id,
        section: formatDateSection(redemption.created_at),
        type: 'claimed',
        title: reward?.title || 'user.activity.unknownReward',
        subtitle: reward?.title || 'user.activity.unknownReward',
        time: redemption.created_at,
        points: `-${redemption.points_spent}`,
        positive: false,
        image: reward?.image_url,
        transactionType: 'redemption',
        storeName: storeMap[redemption.store_id] || 'user.activity.unknownStore',
        storeId: redemption.store_id, // Add storeId for navigation
      };
    });

  } catch (error) {
    return [];
  }
}

// Helper function to format date section
function formatDateSection(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (transactionDate.getTime() === today.getTime()) {
    return 'today';
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else {
    return dateString;
  }
}