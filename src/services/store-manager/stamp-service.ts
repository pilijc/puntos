import { supabase } from "@/supabase/supabase";
import { Stamp } from "@/type/store-manager/stamp";

export async function createStamp(payload: Stamp): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_stamps")
      .insert(payload);
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Error in createStamp:", error);
    throw error;
  }
}