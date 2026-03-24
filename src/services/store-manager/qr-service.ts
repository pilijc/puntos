import { supabase } from "@/supabase/supabase";
import { QRPurchase } from "@/type/store-manager/qr.purchase";

export const createQRService = async (storeId: string, payload: QRPurchase) => {
	try {
		const { data, error } = await supabase.from('store_qr').upsert({
			...payload,
			store_id: storeId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});

		if (error) {
			throw error;
		}
		return data;
	} catch (error) {
		throw error;
	}
};