import { supabase } from "@/supabase/supabase";
import { formatPostGISLocation, withPostGISCoordinates } from "@/utils/location";


export interface CreateStorePayload {
    name: string;
    type: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string;
    registrationNumber?: string;
    timezone?: string | null;
    businessDocumentImage?: string | null;
    storeOpen?: string | null;
    storeClose?: string | null;
    ownerId: string;
    storeLogo?: string | null;
    storePictures?: string[] | null;
    radius?: number | null;
}

export interface StoreRow {
    id: number;
    name: string;
    type: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    location?: any;
    radius: number | null;
    status: string;
    is_active: boolean;
    timezone: string | null;
    logo: string | null;
    owner_id: string | null;
    phone: string | null;
    registration_number: string | null;
    business_document_image: string | null;
    store_pictures?: string[] | null;
    store_open: string | null;
    store_close: string | null;
    created_at: string;
    approved_at: string | null;
}



/**
 * Calls the DB RPC to resolve a timezone string from a lon/lat point.
 * Returns null if PostGIS boundary data hasn't been loaded yet or if no
 * polygon covers the given coordinates.
 */
export async function resolveStoreTimezone(
    longitude: number,
    latitude: number
): Promise<string | null> {
    const { data, error } = await supabase.rpc('resolve_store_timezone', {
        p_longitude: longitude,
        p_latitude: latitude,
    });
    if (error) {
        console.warn('[resolveStoreTimezone] RPC error:', error.message);
        return null;
    }
    return (data as string | null) ?? null;
}

/**
 * Creates a new store and seeds the required related rows:
 * - store_feature (all features off by default)
 * - store_points_rules (sensible defaults)
 * - user_roles (links the owner as "manager" for this store)
 */
export async function createStore(payload: CreateStorePayload): Promise<StoreRow> {
    const { data: store, error: storeError } = await supabase
        .from("stores")
        .insert({
            name: payload.name,
            type: payload.type,
            address: payload.address,
            location: (payload.latitude != null && payload.longitude != null) 
              ? formatPostGISLocation(payload.latitude, payload.longitude) 
              : null,
            timezone: payload.timezone ?? null,
            phone: payload.phone ?? null,
            registration_number: payload.registrationNumber ?? null,
            business_document_image: payload.businessDocumentImage ?? null,
            store_open: payload.storeOpen ?? null,
            store_close: payload.storeClose ?? null,
            logo: payload.storeLogo ?? null,
            radius: payload.radius ?? null,
            owner_id: payload.ownerId,
            status: "pending_review",
            is_active: false,
        })
        .select("*")
        .single();

    if (storeError || !store) {
        throw new Error(storeError?.message ?? "Failed to create store");
    }

    const storeId = store.id;

    await supabase.from("store_feature").insert({
        store_id: storeId,
        streak_enabled: false,
        stamp_enabled: false,
        reward_enabled: false,
        qr_enabled: false,
    });

    await supabase.from("store_points_rules").insert({
        store_id: storeId,
        points_per_unit: 1,
        min_purchase_amount: 0,
        max_points_per_transaction: 100,
    });

    const { data: roleData } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role_id", "2")
        .maybeSingle();

    if (roleData?.id) {
        await supabase.from("user_roles").insert({
            user_id: payload.ownerId,
            role_id: roleData.id,
            store_id: storeId,
        });
    }

    return withPostGISCoordinates(store) as StoreRow;
}

export async function getMyStores(ownerId: string): Promise<StoreRow[]> {
    const [
        { data: ownedData, error: ownedError },
        { data: roleData, error: roleError },
    ] = await Promise.all([
        supabase
            .from("stores")
            .select("*")
            .eq("owner_id", ownerId)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        supabase
            .from("user_roles")
            .select(`
                store_id,
                stores:store_id!inner (*)
            `)
            .eq("user_id", ownerId)
            .eq("stores.is_active", true)
            .not("store_id", "is", null),
    ]);

    if (ownedError) throw new Error(ownedError.message);
    if (roleError) throw new Error(roleError.message);

    const roleStores = (roleData ?? [])
        .map((r: any) => r.stores)
        .filter(Boolean) as StoreRow[];

    const allStores = [...(ownedData ?? []) as StoreRow[], ...roleStores];
    const seen = new Set<number>();
    const unique = allStores.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
    });

    return unique.map((s) => withPostGISCoordinates(s));
}

export async function updateStoreLogo(storeId: number, imageUrl: string): Promise<void> {
    const { error } = await supabase
        .from("stores")
        .update({ logo: imageUrl })
        .eq("id", storeId);

    if (error) throw new Error(error.message);
}


export type UpdateStorePayload = {
    logo?: string | null;
    radius?: number | null;
    store_pictures?: string[] | null;
    business_document_image?: string | null;
};

export async function updateStore(storeId: number, payload: UpdateStorePayload): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (payload.logo !== undefined) updates.logo = payload.logo;
    if (payload.radius !== undefined) updates.radius = payload.radius;
    if (payload.store_pictures !== undefined) updates.store_pictures = payload.store_pictures;
    if (payload.business_document_image !== undefined)
        updates.business_document_image = payload.business_document_image;
    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase.from("stores").update(updates).eq("id", storeId);
    if (error) throw new Error(error.message);
}

export interface AdminStoreRow extends StoreRow {
    owner_name: string | null;
}

export async function getAllStores(): Promise<AdminStoreRow[]> {
    const { data, error } = await supabase
        .from("stores")
        .select(`
            id, name, type, address, location, radius,
            status, is_active, logo, owner_id,
            phone, registration_number, business_document_image, store_pictures, store_open, store_close, created_at, approved_at,
            users!owner_id ( name )
        `)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => {
        const store = withPostGISCoordinates(row);
        return {
            ...store,
            owner_name: row.users?.name ?? null,
            users: undefined,
        };
    }) as AdminStoreRow[];
}

export async function updateStoreStatus(
    storeId: number,
    status: "active" | "inactive" | "pending_review",
    isActive: boolean,
): Promise<void> {
    const { error } = await supabase
        .from("stores")
        .update({ status, is_active: isActive })
        .eq("id", storeId);

    if (error) throw new Error(error.message);
}

export async function getStores() {
    try {
			const { data, error } = await supabase
				.from("stores")
				.select("*")
				.eq("status", "active")
				.eq("is_active", true);
    if (error) throw new Error(error.message);
    return data.map((row: any) => withPostGISCoordinates(row));
    } catch (error) {
        throw error;
    }
}

export async function getStoreById(storeId: number) {
    try {
			const { data, error } = await supabase
				.from("stores")
				.select("*")
				.eq("id", storeId);
			if (error) throw new Error(error.message);
			const store = data?.[0] ?? null;
			if (!store) return null;
			
			return withPostGISCoordinates(store);
    } catch (error) {
        throw error;
    }
}

export type StoreImageKind = "logo" | "picture" | "business_document";

export async function uploadStoreImage(
  storeId: string,
  kind: StoreImageKind,
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

export async function uploadStoreLogo(
    storeId: string,
    base64: string,
    mimeType: string
  ): Promise<string> {
    return uploadStoreImage(storeId, "logo", base64, mimeType);
  }
  
export async function uploadStorePicture(
	storeId: string,
	base64: string,
	mimeType: string
	): Promise<string> {
	return uploadStoreImage(storeId, "picture", base64, mimeType);
}

export async function uploadStoreBusinessDocument(
	storeId: string,
	base64: string,
	mimeType: string
): Promise<string> {
	return uploadStoreImage(storeId, "business_document", base64, mimeType);
}
