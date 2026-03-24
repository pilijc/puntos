import { supabase } from "supabase/supabase";

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
    userId: string
) {
    const voucherCode = generateCode();

    const expiresAt = new Date(Date.now() + 8 * 60 * 1000) 

    const {data, error} = await supabase
        .from('vouchers')
        .insert({
            code: voucherCode,
            expires_at: expiresAt.toISOString(),
            user_id: userId,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}