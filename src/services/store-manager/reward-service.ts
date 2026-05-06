import { supabase } from "@/supabase/supabase";
import { Reward } from "@/type/store-manager/reward";
import { assertStoreOwnerCanManagePremiumCampaigns } from "@/services/store-manager/premium-campaign-gate";

export async function getRewardsByStoreId(storeId: string): Promise<Reward[]> {
  try {
    const { data, error } = await supabase
      .from("store_rewards")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Reward[];
  } catch (error) {
    throw new Error("Failed to get rewards by store id: " + error);
  }
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
    throw new Error("Failed to get rewards by store id page: " + error);
  }
}

export async function getRewardById(storeId: string, rewardId: string): Promise<Reward | null> {
  try {
    const { data, error } = await supabase
      .from("store_rewards")
      .select("*")
      .eq("store_id", storeId)
      .eq("id", rewardId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data ?? null) as Reward | null;
  } catch (error) {
    throw new Error("Failed to get reward by id: " + error);
  }
}

export async function upsertReward(
  reward: Partial<Reward> & Pick<Reward, "store_id" | "title" | "description" | "points_cost" | "stock" | "image_url">,
): Promise<void> {
  try {
    await assertStoreOwnerCanManagePremiumCampaigns(reward.store_id);

    const isUpdate = Boolean(reward.id?.trim());
    const isActive = reward.is_active ?? true;

    if (isUpdate) {
      const { data, error } = await supabase
        .from("store_rewards")
        .update({
          title: reward.title,
          description: reward.description,
          points_cost: reward.points_cost,
          stock: reward.stock,
          image_url: reward.image_url,
          is_active: isActive,
        })
        .eq("id", reward.id as string)
        .eq("store_id", reward.store_id)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data?.length) {
        throw new Error("Reward not found or does not belong to this store.");
      }
      return;
    }

    const { error } = await supabase.from("store_rewards").insert({
      store_id: reward.store_id,
      title: reward.title,
      description: reward.description,
      points_cost: reward.points_cost,
      stock: reward.stock,
      image_url: reward.image_url,
      is_active: isActive,
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error("Failed to upsert reward: " + error);
  }
}

export async function deleteReward(storeId: string, rewardId: string): Promise<void> {
  try {
    await assertStoreOwnerCanManagePremiumCampaigns(storeId);

    const { error } = await supabase
      .from("store_rewards")
      .delete()
      .eq("id", rewardId)
      .eq("store_id", storeId);

    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error("Failed to delete reward: " + error);
  }
}

export async function uploadRewardImage(
  storeId: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  try {
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

    const { data } = supabase.storage.from("puntos-public").getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    throw new Error("Failed to upload reward image: " + error);
  }
}
