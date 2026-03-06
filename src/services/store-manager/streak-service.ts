import { supabase } from "@/supabase/supabase";
import { Streak } from "@/type/store-manager/streak";

export async function createStreak(payload: Streak): Promise<void> {
	try {
		const { error } = await supabase
			.from("store_streaks")
			.insert(payload);
		if (error) throw new Error(error.message);
	} catch (error) {
		console.error("Error in createStreak:", error);
		throw error;
	}
}