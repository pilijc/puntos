import { supabase } from "@/supabase/supabase";
import { OneSignal } from "react-native-onesignal";

export async function upsertPushId() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  const subId = await getOneSignalId();
  if (!subId) return;

  await supabase
    .from("user_push_tokens")
    .upsert({
      user_id: user.id,
      onesignal_subscription_id: subId,
      updated_at: new Date().toISOString(),
    });
}

export async function getOneSignalId(): Promise<string | null> {
  await OneSignal.Notifications.requestPermission(true);
  return OneSignal.User.pushSubscription.getIdAsync();
}