import { supabase } from "@/supabase/supabase";
import { getCurrentStaffId } from "./voucher-service";

export async function checkQRAccessForStore(storeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("store_feature")
      .select("qr_enabled")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw error;
    return data?.qr_enabled ?? false;
  } catch (error) {
    console.error("Error checking QR access:", error);
    return false;
  }
}

export async function checkQRAccessForCurrentStaff(): Promise<boolean> {
  try {
    const staffId = await getCurrentStaffId();
    if (!staffId) return false;

    const { data: staffData, error: staffError } = await supabase
      .from("store_staff")
      .select("store_id")
      .eq("user_id", staffId)
      .single();

    if (staffError || !staffData?.store_id) return false;

    return await checkQRAccessForStore(staffData.store_id.toString());
  } catch (error) {
    console.error("Error checking QR access for current staff:", error);
    return false;
  }
}
