import { supabase } from "@/supabase/supabase";

export interface Reward {
  id: number;
  store_id: number;
  title: string;
  description: string;
  points_cost: number;
  image_url: string | null;
  is_active: boolean;
  type?: string;
  stock?: number;
  created_at: string;
  popularity?: number; // Calculated or stored
}

export type RewardSortOrder = "popular" | "points" | "newest";
export type PointsOrder = "asc" | "desc";

export async function getRewards(options: {
  storeId?: string;
  sortBy?: RewardSortOrder;
  pointsOrder?: PointsOrder;
  limit?: number;
}): Promise<Reward[]> {
  const { storeId, sortBy = "popular", pointsOrder = "desc", limit = 20 } = options;

  let query = supabase
    .from("store_rewards")
    .select("*")
    .eq("is_active", true);

  if (storeId) {
    query = query.eq("store_id", storeId);
  }

  // Backend Sorting Logic 
  if (sortBy === "points") {
    query = query.order("points_cost", { ascending: pointsOrder === "asc" });
  } else if (sortBy === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    // Default to "popular" - if there's no popularity column, fallback to created_at
    // Check database.txt: store_rewards does NOT have a popularity column.
    // We can use created_at as a fallback or if we add a popularity column later.
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Reward[];
}

export async function getRewardById(id: number): Promise<Reward | null> {
  const { data, error } = await supabase
    .from("store_rewards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Reward;
}
