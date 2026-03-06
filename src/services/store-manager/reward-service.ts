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
  const filePath = `store-rewards/${storeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("puntos-public")
    .upload(filePath, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from("puntos-public")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
