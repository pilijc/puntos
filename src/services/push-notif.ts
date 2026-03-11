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

export async function sendPushNotification(
  subscriptionId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  try {
    const res = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
        name: "Puntos",
        target_channel: "push",
        include_subscription_ids: [subscriptionId],
        headings: { en: title ?? "Sample" },
        contents: { en: body ?? "Hello" },
        data,
        android_channel_id: process.env.EXPO_PUBLIC_ONESIGNAL_ANDROID_CHANNEL_ID,
        priority: 10,
      }),
    });
    return res;
  } catch (e) {
    return e as Error;
  }
}