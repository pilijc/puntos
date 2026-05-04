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
        store_rewards (
          title,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reward redemption history:', error);
      return [];
    }

    // Get store names
    const storeIds = [...new Set(redemptions.map(r => r.store_id).filter(id => id != null))];
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    if (storesError) {
      console.error('Error fetching store names:', storesError);
    }

    // Create store lookup map
    const storeMap = (stores || []).reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {});

    // Format the data for the UI
    return redemptions.map((redemption: any) => ({
      id: redemption.id,
      section: formatDateSection(redemption.created_at),
      type: 'claimed',
      title: redemption.store_rewards?.title || 'user.activity.unknownReward',
      subtitle: 'user.activity.subtitle.rewardRedemption',
      time: redemption.created_at,
      points: `-${redemption.points_spent}`,
      positive: false,
      image: redemption.store_rewards?.image_url,
      transactionType: 'redemption',
      storeName: storeMap[redemption.store_id] || 'user.activity.unknownStore',
      storeId: redemption.store_id, // Add storeId for navigation
    }));

  } catch (error) {
    console.error('Exception fetching reward redemption history:', error);
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