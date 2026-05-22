import { Platform } from "react-native";
import { supabase } from "@/supabase/supabase";

let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;

if (Platform.OS !== "web") {
  OneSignal = require("react-native-onesignal").OneSignal;
}

export function isOneSignalNativeAvailable(): boolean {
  return Platform.OS !== "web" && OneSignal != null;
}

export async function upsertPushId() {
  if (!isOneSignalNativeAvailable() || !OneSignal) return;

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  const subId = await getOneSignalId();
  if (!subId) return;

  await supabase.from("user_push_tokens").upsert({
    user_id: user.id,
    onesignal_subscription_id: subId,
    updated_at: new Date().toISOString(),
  });
}

export async function getOneSignalId(): Promise<string | null> {
  if (!isOneSignalNativeAvailable() || !OneSignal) return null;

  await OneSignal.Notifications.requestPermission(true);
  return await OneSignal.User.pushSubscription.getIdAsync();
}

export async function sendPushNotification(
  subscriptionId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  const { data: response, error } = await supabase.functions.invoke(
    "send-notification",
    {
      body: {
        subscriptionId,
        title,
        body,
        data,
      },
    }
  );

  if (error) {
    throw error;
  }

  return response;
}