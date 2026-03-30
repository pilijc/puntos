import { supabase } from "@/supabase/supabase";
import { Reward } from "@/type/store-manager/reward";

export async function getRewardsByStoreId(storeId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from("store_rewards")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Reward[];
}

export async function getRewardsByStoreIdPage(
  storeId: string,
  page: number,
  pageSize: number = 15,
): Promise<Reward[]> {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("store_rewards")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return (data ?? []) as Reward[];
  } catch (error) {
    throw error;
  }
}

export async function getRewardById(storeId: string, rewardId: string): Promise<Reward | null> {
  const { data, error } = await supabase
    .from("store_rewards")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", rewardId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Reward | null;
}

export async function createReward(reward: Reward): Promise<void> {
  const { error } = await supabase
    .from("store_rewards")
    .insert(reward);

  if (error) throw new Error(error.message);
}

export async function uploadRewardImage(
  storeId: string,
  base64: string,
  mimeType: string
): Promise<string> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = mimeType.split("/")[1] ?? "jpg";
  const filePath = `store/rewards/${storeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("puntos-public")
    .upload(filePath, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from("puntos-public")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
