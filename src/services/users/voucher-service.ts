import { supabase } from "supabase/supabase";
import { Voucher } from "@/type/user/voucher";

const limit = 5; 

function generateCode(length: number = limit): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function generateVoucherCode(
  userId: string,
  durationMinutes: number = 5
) {
  const voucherCode = generateCode();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  try {
    //Check if user already has active voucher
    const { data: existingVoucher } = await supabase
      .from("vouchers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_used", false)
      .gte("expires_at", now)
      .maybeSingle();

    if (existingVoucher) {
      await supabase
      .from('vouchers')
      .update({ is_used: true})
      .eq("id", existingVoucher.id)
    }

    //Create voucher
    const { data: voucherData, error: voucherError } = await supabase
      .from("vouchers")
      .insert({
        code: voucherCode,
        expires_at: expiresAt,
        user_id: userId,
        is_used: false,
      })
      .select()
      .single();

    if (voucherError || !voucherData) {
      throw voucherError ?? new Error("Failed to generate voucher.");
    }

    return voucherData;

  } catch (error) {
    console.error("Error generating voucher:", error);
    throw error;
  }
}
 
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