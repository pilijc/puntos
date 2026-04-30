import { supabase } from "@/supabase/supabase";
import { StoreDetail } from "@/type/store-manager/detail";
import { formatPostGISLocation, parsePostGISLocation } from "@/utils/location";

export async function getStoreDetail(storeId: string): Promise<StoreDetail> {
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, name, type, logo, store_pictures, phone, registration_number, business_document_image, store_open, store_close, address, location, radius, status, is_active"
    )
    .eq("id", storeId)
    .single();

  if (error) throw new Error(error.message);

  const parsedLocation = parsePostGISLocation(data.location);

  return {
    ...data,
    latitude: parsedLocation.latitude,
    longitude: parsedLocation.longitude,
  } as StoreDetail;
}

export async function updateStoreDetail(
  storeId: string,
  payload: Partial<Omit<StoreDetail, "id">>
): Promise<void> {
  const updatePayload: any = { ...payload, updated_at: new Date().toISOString() };

  // Convert latitude/longitude to PostGIS location format if both are provided
  if ('latitude' in updatePayload && 'longitude' in updatePayload) {
    if (updatePayload.latitude != null && updatePayload.longitude != null) {
      updatePayload.location = formatPostGISLocation(updatePayload.latitude, updatePayload.longitude);
    }
    delete updatePayload.latitude;
    delete updatePayload.longitude;
  }

  const { error } = await supabase
    .from("stores")
    .update(updatePayload)
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
