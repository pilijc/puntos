import { createClient } from "@supabase/supabase-js";
import { QRPurchase } from "@/type/store-manager/qr.purchase";

const supabase = createClient(
  process.env.EXPO_PUBLIC_API_URL!,
  process.env.EXPO_PUBLIC_SERVICE_ROLE_KEY!
);

export const getQRConfig = async (storeId: string) => {
  const [qrResult, featureResult] = await Promise.all([
    supabase
      .from("store_qr")
      .select("*")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("store_feature")
      .select("qr_enabled")
      .eq("store_id", storeId)
      .maybeSingle(),
  ]);

  if (qrResult.error) throw qrResult.error;
  if (!qrResult.data) return null;

  return {
    ...(qrResult.data as QRPurchase & { id: string; updated_at: string }),
    qr_enabled: featureResult.data?.qr_enabled ?? false,
  };
};

export const deleteQRConfig = async (storeId: string) => {
  const { error: qrError } = await supabase
    .from("store_qr")
    .delete()
    .eq("store_id", storeId);

  if (qrError) throw qrError;

  const { error: featureError } = await supabase
    .from("store_feature")
    .update({ qr_enabled: false, updated_at: new Date().toISOString() })
    .eq("store_id", storeId);

  if (featureError) throw featureError;
};

export const toggleQREnabled = async (storeId: string, enabled: boolean) => {
  const { error } = await supabase
    .from("store_feature")
    .update({ qr_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("store_id", storeId);

  if (error) throw error;
};

export const createQRService = async (storeId: string, payload: QRPurchase) => {
  try {
    const { data: rows } = await supabase
      .from("store_qr")
      .select("id")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false });

    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    const latestId = ids[0] ?? null;

    if (ids.length > 1) {
      await supabase.from("store_qr").delete().in("id", ids.slice(1));
    }

    const qrPayload = {
      ...payload,
      store_id: storeId,
      updated_at: new Date().toISOString(),
    };

    const { error } = latestId
      ? await supabase.from("store_qr").update(qrPayload).eq("id", latestId)
      : await supabase.from("store_qr").insert({ ...qrPayload, created_at: new Date().toISOString() });

    if (error) throw error;

    const { error: featureError } = await supabase
      .from("store_feature")
      .update({ qr_enabled: true, updated_at: new Date().toISOString() })
      .eq("store_id", storeId);

    if (featureError) throw featureError;
  } catch (error) {
    throw error;
  }
};
