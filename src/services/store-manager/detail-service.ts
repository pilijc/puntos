import { supabase } from "@/supabase/supabase";
import { StoreDetail } from "@/type/store-manager/detail";

export async function getStoreDetail(storeId: string): Promise<StoreDetail> {
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, name, type, logo, store_pictures, phone, registration_number, business_document_image, store_open, store_close, address, latitude, longitude, radius, status, is_active"
    )
    .eq("id", storeId)
    .single();

  if (error) throw new Error(error.message);
  return data as StoreDetail;
}

export async function updateStoreDetail(
  storeId: string,
  payload: Partial<Omit<StoreDetail, "id">>
): Promise<void> {
  const { error } = await supabase
    .from("stores")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", storeId);

  if (error) throw new Error(error.message);
}

export async function uploadDetailImage(
  storeId: string,
  kind: "logo" | "picture" | "business_document",
  base64: string,
  mimeType: string
): Promise<string> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = mimeType.split("/")[1] ?? "jpg";
  const folder =
    kind === "logo"
      ? "store/logo"
      : kind === "business_document"
      ? "store/documents"
      : "store/pictures";
  const filePath = `${folder}/${storeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("puntos-public")
    .upload(filePath, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("puntos-public").getPublicUrl(filePath);
  return data.publicUrl;
}
