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
    radius: number | null;
    status: string;
    is_active: boolean;
    logo: string | null;
    banner: string | null;
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
            logo: payload.storeImageUrl ?? null,
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

    return store as StoreRow;
}

export async function getMyStores(ownerId: string): Promise<StoreRow[]> {
    const selectFields = "id, name, type, address, latitude, longitude, radius, status, is_active, logo, owner_id, phone, registration_number, created_at";

    const { data: ownedData, error: ownedError } = await supabase
        .from("stores")
        .select(selectFields)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

    if (ownedError) throw new Error(ownedError.message);

    const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select(`store_id, stores:store_id ( ${selectFields} )`)
        .eq("user_id", ownerId)
        .not("store_id", "is", null);

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

    return unique;
}

export async function updateStoreLogo(storeId: number, imageUrl: string): Promise<void> {
    const { error } = await supabase
        .from("stores")
        .update({ logo: imageUrl })
        .eq("id", storeId);

    if (error) throw new Error(error.message);
}

export interface AdminStoreRow extends StoreRow {
    owner_name: string | null;
}

export async function getAllStores(): Promise<AdminStoreRow[]> {
    const { data, error } = await supabase
        .from("stores")
        .select(`
            id, name, type, address, latitude, longitude, radius,
            status, is_active, logo, banner, owner_id,
            phone, registration_number, created_at,
            users ( name )
        `)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
        ...row,
        owner_name: row.users?.name ?? null,
        users: undefined,
    })) as AdminStoreRow[];
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
				.eq("status", "active");
    if (error) throw new Error(error.message);
    return data;
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
			return data?.[0] ?? null;
    } catch (error) {
        throw error;
    }
}