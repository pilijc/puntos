import { supabase } from "@/supabase/supabase";
import { ProcessVoucherCode } from "../../type/frontdesk/voucher";
import { Voucher } from "../../type/user/voucher";
import { FinalCalculations } from "../frontdesk/percentage-service";

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
        const status = "expired";
        if (now > voucher.expires_at) {
        const {error: updateError} = await supabase
            .from("vouchers")
            .update({ 
                is_used: true,
                used_at: now,
                status: status
            })
            .eq("code", voucherCode);
            
            if (updateError) {
                return {
                    success: false,
                    message: "Error updating voucher",
                };
            }
            
            return {
                success: false,
                message: "Voucher has expired",
            };
        }

        // Mark voucher as used
        const { error: voucherUpdateError } = await supabase
            .from("vouchers")
            .update({ 
                is_used: true,
                used_at: now,
                status: "used"
            })
            .eq("code", voucherCode);

        if (voucherUpdateError) {
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
           const pointResult = await FinalCalculations(storeId, amount);
           const pointsEarned = pointResult.points;
        
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

        // Check if purchase creation was successful
        if (purchaseError || !purchaseData) {
            console.error("Purchase creation error:", purchaseError);
            
            // Rollback voucher status to unused
            await supabase
                .from('vouchers')
                .update({ is_used: false, used_at: null })
                .eq('id', voucher.id);

            return {
                success: false,
                message: "Failed to create purchase record. Please try again.",
                pointsEarned: 0,
            };
        }

        // Update with points earned
        const { error: updateError } = await supabase
            .from("purchases")
            .update({ points_earned: pointsEarned })
            .eq("id", purchaseData.id);

        if (updateError) {
            console.error("Purchase update error:", updateError);
            
            // Rollback voucher status and delete purchase
            await supabase
                .from('vouchers')
                .update({ is_used: false, used_at: null })
                .eq('id', voucher.id);
            
            await supabase
                .from("purchases")
                .delete()
                .eq("id", purchaseData.id);

            return {
                success: false,
                message: "Failed to update purchase with points. Please try again.",
                pointsEarned: 0,
            };
        }

        // Create transaction record
        const { data: transactionData, error: transactionError } = await supabase
            .from("voucher_transactions")
            .insert({
                voucher_id: voucher.id,
                user_id: voucher.user_id,
                store_staff_id: storeStaffId,
                store_id: storeId, 
                amount: amount,
                points_earned: pointsEarned,
                created_at: currentTime
            })
            .select()
            .single();

        if (transactionError) {
            console.error("Transaction recording error:", transactionError);

            // Rollback voucher status to unused
            await supabase
                .from('vouchers')
                .update({ is_used: false, used_at: null })
                .eq('id', voucher.id);

            // Also rollback the purchase record
            await supabase
                .from("purchases")
                .delete()
                .eq("id", purchaseData.id);

            return {
                success: false,
                message: "Failed to record voucher transaction. Please try again.",
                pointsEarned: 0,
            };
        }

        return {
            success: true,
            message: "Voucher processed successfully",
            transactionId: transactionData.id, // Return correct transaction ID
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
