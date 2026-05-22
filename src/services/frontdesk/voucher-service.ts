import { supabase } from "@/supabase/supabase";
import { ProcessVoucherCode } from "../../type/frontdesk/voucher";
import { Voucher } from "../../type/user/voucher";
import { FinalCalculations } from "../frontdesk/percentage-service";
import { canUserEarnPurchasePoints } from "@/services/points/earning-gate";
import { logger } from "@/utils/logger";

export async function getCurrentStaffId(): Promise<string | null> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            logger.error("Staff not authenticated:", authError);
            return null;
        }
        
        return user.id;
    } catch (error) {
        logger.error("Error getting current staff ID:", error);
        return null;
    }
}

export async function processVoucherCode(
    voucherCode: string,
    amount: number,
    storeStaffId: string
): Promise<ProcessVoucherCode> {
    let voucherConsumed = false;
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
            .eq("code", voucherCode)
            .eq("is_used", false);
            
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
        const { data: consumedVoucher, error: voucherUpdateError } = await supabase
            .from("vouchers")
            .update({ 
                is_used: true,
                used_at: now,
                status: "used"
            })
            .eq("code", voucherCode)
            .eq("is_used", false)
            .select("id")
            .maybeSingle();

        if (voucherUpdateError) {
            return {
                success: false,
                message: "Failed to process voucher",
            };
        }
        
        if (!consumedVoucher) {
            return {
                success: false,
                message: "Voucher has already been used",
            };
        }

        voucherConsumed = true;
        const { data: staffData, error: staffError } = await supabase
            .from('store_staff')
            .select('store_id')
            .eq('user_id', storeStaffId)
            .eq('is_active', true)
            .single();

        if (staffError || !staffData) {
            // Rollback voucher status to unused
            await supabase
                .from('vouchers')
                .update({ is_used: false, used_at: null, status: "active" })
                .eq('id', voucher.id);

            return {
                success: false,
                message: "Failed to get store information for staff member",
            };
        }

           const storeId = staffData.store_id;
           const pointResult = await FinalCalculations(storeId, amount);
           const eligible = await canUserEarnPurchasePoints({ userId: voucher.user_id, storeId });
           const pointsEarned = eligible ? pointResult.points : 0;
        
        const currentTime = new Date().toISOString();
        const { data: purchaseData, error: purchaseError } = await supabase
            .from("purchases")
            .insert({
                user_id: voucher.user_id,
                store_id: storeId,
                amount: amount,
                created_at: currentTime,
                points_earned: pointsEarned,
            })
            .select()
            .single();

        // Check if purchase creation was successful
        if (purchaseError || !purchaseData) {
            logger.error("Purchase creation error:", purchaseError);
            
            // Rollback voucher status to unused
            await supabase
                .from('vouchers')
                .update({ is_used: false, used_at: null, status: "active" })
                .eq('id', voucher.id);

            return {
                success: false,
                message: "Failed to create purchase record. Please try again.",
                pointsEarned: 0,
            };
        }

       
        const { error: updateError } = await supabase
            .from("purchases")
            .update({ 
                points_earned: pointsEarned,
                metadata: {
                    transaction_type: "voucher",
                    processed_by_staff: storeStaffId,
                    voucher_id: voucher.id
                }
            })
            .eq("id", purchaseData.id);

        if (updateError) {
            logger.error("Error updating purchase with staff info:", updateError);
         }

        // Update with points  
        const { error: pointsUpdateError } = await supabase
            .from("purchases")
            .update({ points_earned: pointsEarned })
            .eq("id", purchaseData.id);

        if (pointsUpdateError) {
            logger.error("Purchase update error:", pointsUpdateError);
            
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
            logger.error("Transaction recording error:", transactionError);

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
        logger.error("Voucher processing error:", error);

        try {
            if (voucherConsumed) {
                await supabase
                    .from('vouchers')
                    .update({ is_used: false, used_at: null, status: "active" })
                    .eq('code', voucherCode);
            }
        } catch (rollbackErr) {
            logger.warn("[Voucher] rollback failed:", rollbackErr);
        }

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
        logger.error("Voucher verification error:", error);
        return {
            valid: false,
            message: "An error occurred while verifying the voucher",
        };
    }
}
