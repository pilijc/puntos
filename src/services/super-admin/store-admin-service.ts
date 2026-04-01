import { supabase } from "@/supabase/supabase";
import { AdminStoreRow } from "../store-service";

export async function getAllStoresForAdmin(): Promise<AdminStoreRow[]> {
    const { data, error } = await supabase
        .from("stores")
        .select(`
            id, name, type, address, latitude, longitude, radius,
            status, is_active, logo, owner_id,
            phone, registration_number, business_document_image, store_pictures, store_open, store_close, created_at,
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

export async function updateAdminStoreStatus(
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
