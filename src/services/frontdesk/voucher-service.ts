import { supabase } from "@/supabase/supabase";
import { ProcessVoucherCode } from "../../type/frontdesk/voucher";
import { Voucher } from "../../type/user/voucher";
import { points } from "@turf/turf";

export async function getCurrentStaffId(): Promise<string | null> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error("Staff not authenticated:", authError);
            return null;
        }
        
        return user.id;
    } catch (error) {
        console.error("Error getting current staff ID:", error);
        return null;
    }
}

export async function processVoucherCode(
    voucherCode: string,
    amount: number,
    storeStaffId: string
): Promise<ProcessVoucherCode> {
    try {
        // Find the voucher by code
        const { data: voucher, error: voucherError } = await supabase
            .from("vouchers")
            .select("*")
            .eq("code", voucherCode)
            .single();

        if (voucherError || !voucher) {
            return {
                success: false,
                message: "Invalid voucher code",
            };
        }

        // Check if voucher is already used
        if (voucher.is_used) {
            return {
                success: false,
                message: "Voucher has already been used",
            };
        }

        // Check if voucher is expired (using UTC time)
        const now = new Date().toISOString();
        if (now > voucher.expires_at) {
            return {
                success: false,
                message: "Voucher has expired",
            };
        }

        // Mark voucher as used
        const { error: updateError } = await supabase
            .from("vouchers")
            .update({ 
                is_used: true,
                used_at: now
            })
            .eq("code", voucherCode);

        if (updateError) {
            return {
                success: false,
                message: "Failed to process voucher",
            };
        }
        // Get store_id from staff
        const { data: staffData, error: staffError } = await supabase
            .from('store_staff')
            .select('store_id')
            .eq('user_id', storeStaffId)
            .eq('is_active', true)
            .single();

        if (staffError || !staffData) {
            return {
                success: false,
                message: "Failed to get store information for staff member",
            };
        }

        const storeId = staffData.store_id;

        // Get points configuration for this store
        console.log(`Looking up points configuration for store_id: ${storeId}`);
        const { data: pointsData, error: pointsError } = await supabase
            .from('store_qr')
            .select('percentage')
            .eq('store_id', storeId)
            .single();

        console.log('Points data lookup result:', { pointsData, pointsError });

        // default 10% if no configuration is found
        const percentage = pointsData?.percentage || 10;
        
        if (pointsError) {
            console.warn(`No points configuration found for store ${storeId}, using default 10%. Error:`, pointsError);
        } else {
            console.log(`Using percentage ${percentage}% for store ${storeId}`);
        }

        // Calculate points using dynamic percentage
        const pointsEarned = Math.ceil(amount * (percentage / 100));
        console.log(`Voucher Service: Calculated points: ${pointsEarned} (amount: ${amount}, percentage: ${percentage}%)`);

        const currentTime = new Date().toISOString();
            const { data: purchaseData, error: purchaseError } = await supabase
            .from("purchases")
            .insert({
                user_id: voucher.user_id,
                store_id: storeId,
                amount: amount,
                created_at: currentTime,
            })
            .select()
            .single();

        // Update with points earned
        await supabase
            .from("purchases")
            .update({ points_earned: pointsEarned })
            .eq("id", purchaseData.id);

        // Create transaction record
        const { error: transactionError } = await supabase
            .from("voucher_transactions")
            .insert({
                voucher_id: voucher.id,
                user_id: voucher.user_id,
                store_staff_id: storeStaffId,
                store_id: storeId, 
                amount: amount,
                points_earned: pointsEarned,
                created_at: currentTime
            });

        if (transactionError) {
            console.error("Transaction recording error:", transactionError);
            
        }

        return {
            success: true,
            message: "Voucher processed successfully",
            transactionId: voucher.id,
            pointsEarned: pointsEarned,
        };
    } catch (error) {
        console.error("Voucher processing error:", error);
        return {
            success: false,
            message: "An error occurred while processing the voucher",
        };
    }
}

export async function verifyVoucherCode(voucherCode: string): Promise<{
    valid: boolean;
    voucher?: Voucher;
    message: string;
}> {
    try {
        const { data: voucher, error } = await supabase
            .from("vouchers")
            .select("*")
            .eq("code", voucherCode)
            .single();

        if (error || !voucher) {
            return {
                valid: false,
                message: "Invalid voucher code",
            };
        }

        if (voucher.is_used) {
            return {
                valid: false,
                voucher,
                message: "Voucher has already been used",
            };
        }

        // Check if voucher is expired (using UTC time)
        const now = new Date().toISOString();
        if (now > voucher.expires_at) {
            return {
                valid: false,
                voucher,
                message: "Voucher has expired",
            };
        }

        return {
            valid: true,
            voucher,
            message: "Voucher is valid",
        };
    } catch (error) {
        console.error("Voucher verification error:", error);
        return {
            valid: false,
            message: "An error occurred while verifying the voucher",
        };
    }
}

    // const { data: purchaseData, error: purchaseError } = await supabase
    //   .from("purchases")
    //   .insert({
    //     user_id: userId,
    //     store_id: storeId,
    //     amount: purchaseAmount,
    //     created_at: new Date().toISOString(),
    //   })
    //   .select()
    //   .single();

    // if (purchaseError) {
    //   throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
    // }

    // // ✅ Update purchase with points
    // const { error: updatePurchaseError } = await supabase
    //   .from("purchases")
    //   .update({
    //     points_earned: pointsToAward,
    //   })
    //   .eq("id", purchaseData.id);

    // if (updatePurchaseError) {
    //   console.error("Failed to update purchase:", updatePurchaseError);
    // }

    // export async function getActiveVoucher(userId: string): Promise<Voucher | null> {
//   const { data, error } = await supabase
//     .from("vouchers")
//     .select("*")
//     .eq("user_id", userId)
//     .eq("is_used", false)
//     .gte("expires_at", new Date().toISOString())
//     .maybeSingle();

//   if (error) {
//     console.error("Error fetching active voucher:", error);
//     return null;
//   }

//   return data ?? null;
// }

// export async function markVoucherUsed(voucherId: string): Promise<boolean> {
//   const { error } = await supabase
//     .from<Voucher>("vouchers")
//     .update({ used_at: true })
//     .eq("id", voucherId);

//   if (error) {
//     console.error("Error marking voucher as used:", error);
//     return false;
//   }

//   return true;
// }