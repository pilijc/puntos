import { supabase } from "@/supabase/supabase";

export interface CreateStorePayload {
    name: string;
    type: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string;
    registrationNumber?: string;
    ownerId: string;
    storeImageUrl?: string;
}

export interface StoreRow {
    id: number;
    name: string;
    type: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    is_active: boolean;
    store_image: string | null;
    owner_id: string | null;
    phone: string | null;
    registration_number: string | null;
    created_at: string;
}

/**
 * Creates a new store and seeds the required related rows:
 * - store_feature (all features off by default)
 * - store_points_rules (sensible defaults)
 * - user_roles (links the owner as "manager" for this store)
 */
export async function createStore(payload: CreateStorePayload): Promise<StoreRow> {
    // 1. Insert the store
    const { data: store, error: storeError } = await supabase
        .from("stores")
        .insert({
            name: payload.name,
            type: payload.type,
            address: payload.address,
            latitude: payload.latitude ?? null,
            longitude: payload.longitude ?? null,
            phone: payload.phone ?? null,
            registration_number: payload.registrationNumber ?? null,
            store_image: payload.storeImageUrl ?? null,
            owner_id: payload.ownerId,
            status: "pending_review",
            is_active: false,
        })
        .select()
        .single();

    if (storeError || !store) {
        throw new Error(storeError?.message ?? "Failed to create store");
    }

    const storeId = store.id;

    // 2. Seed store_feature row
    await supabase.from("store_feature").insert({
        store_id: storeId,
        streak_enabled: false,
        stamp_enabled: false,
        reward_enabled: false,
    });

    // 3. Seed store_points_rules row
    await supabase.from("store_points_rules").insert({
        store_id: storeId,
        points_per_unit: 1,
        min_purchase_amount: 0,
        max_points_per_transaction: 100,
    });

    // 4. Get manager role id and link via user_roles
    const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("role_type", "manager")
        .maybeSingle();

    if (roleData?.id) {
        await supabase.from("user_roles").insert({
            user_id: payload.ownerId,
            role_id: roleData.id,
            store_id: storeId,
        });
    }

    return store as StoreRow;
}

/**
 * Fetches all stores owned by the given user id.
 */
export async function getMyStores(ownerId: string): Promise<StoreRow[]> {
    const { data, error } = await supabase
        .from("stores")
        .select("id, name, type, address, latitude, longitude, status, is_active, store_image, owner_id, phone, registration_number, created_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as StoreRow[];
}

/**
 * Updates the store_image URL for an existing store.
 */
export async function updateStoreLogo(storeId: number, imageUrl: string): Promise<void> {
    const { error } = await supabase
        .from("stores")
        .update({ store_image: imageUrl })
        .eq("id", storeId);

    if (error) throw new Error(error.message);
}

export async function getStores() {
    try {
			const { data, error } = await supabase
				.from("stores")
				.select("*")
				.eq("status", "active");
    if (error) throw new Error(error.message);
    return data;
    } catch (error) {
        throw error;
    }
}