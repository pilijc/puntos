import { supabase } from "@/supabase/supabase";
import { parseQRCode, createQRTransaction } from "@/services/users/qr-service";
import { FrontDeskScanResult, ScanResult } from "@/type/qr-transaction";


  
export async function processFrontDeskScan(
  qrData: string,
  purchaseAmount: number
): Promise<FrontDeskScanResult> {
  // Parse the QR code
  const parsed = parseQRCode(qrData);

  if (!parsed) {
    return { success: false, message: "Invalid QR Code. This QR code is not recognized." };
  }

  //Get current staff user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Staff not authenticated." };
  }

  //Create QR transaction
  try {
    const transaction = await createQRTransaction(
      parsed.userId,
      user.id,
      purchaseAmount
    );

    return {
      success: true,
      message: "Customer QR scanned successfully",
      transactionId: transaction.id,
      pointsEarned: transaction.points_earned,
    };
  } catch (error) {
     return { 
      success: false, 
      message: `Failed to process QR code: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

 //Get the store for operator side
export async function getCurrentUserStore(): Promise<{name: string; id: number} | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

     const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
       return null;
    }

    if (profile.role !== "front_desk") {
       return null;
    }

    // Get store_id from store_staff table for current user
    const { data: staffData, error: staffError } = await supabase
      .from('store_staff')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
       return null;
    }

    // Get store name from stores table
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('name')
      .eq('id', staffData.store_id)
      .eq('status', 'active')
      .single();

    if (storeError || !storeData) {
       return null;
    }

    return { name: storeData.name, id: staffData.store_id };
  } catch (error) {
     return null;
  }
}

export const getCurrentUserIsActive = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("store_staff")
    .select("is_active")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
     return false;
  }

  return data.is_active ?? false;
};


 