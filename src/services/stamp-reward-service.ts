import { supabase } from "@/supabase/supabase";
import { logger } from "@/utils/logger";

export interface StampReward {
  id: string;
  user_id: string;
  store_id: number;
  current_stamp_count: number;
  target_stamps: number;
  last_stamp_date: string;
  created_at: string;
  updated_at: string;
}

export async function getUserStampRewards(userId: string): Promise<StampReward[]> {
  const { data, error } = await supabase
    .from("stamp_rewards")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    logger.error("Error fetching stamp rewards:", error);
    throw error;
  }

  // Filter out any entries where the store features might be disabled (optional but good practice)
  // To keep it fast, we can just return the data since the store list logic handles active stores
  return data as StampReward[];
}
