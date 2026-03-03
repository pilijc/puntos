import { supabase } from "@/supabase/supabase";

export async function savePushSubIdToSupabase(subId: string) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("user_push_tokens")
    .upsert(
      { user_id: userId, push_sub_id: subId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}