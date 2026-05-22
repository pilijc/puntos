import { Platform } from "react-native";
import { supabase } from "@/supabase/supabase";
import { ServiceResponse } from "@/type/service-response";

let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;

if (Platform.OS !== "web") {
  OneSignal = require("react-native-onesignal").OneSignal;
}

export function isOneSignalNativeAvailable(): boolean {
  return Platform.OS !== "web" && OneSignal != null;
}

export async function upsertPushId(): Promise<ServiceResponse<void>> {
  try {
    if (!isOneSignalNativeAvailable() || !OneSignal) return { data: undefined, error: null } as any;

    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return { data: null, error: new Error(authError.message) };
    
    const user = auth.user;
    if (!user) return { data: null, error: new Error("No authenticated user") };

    const subId = await getOneSignalId();
    if (!subId) return { data: null, error: new Error("Could not get OneSignal subscription ID") };

    const { error } = await supabase.from("user_push_tokens").upsert({
      user_id: user.id,
      onesignal_subscription_id: subId,
      updated_at: new Date().toISOString(),
    });

    if (error) return { data: null, error: new Error(error.message) };

    return { data: undefined, error: null } as any;
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
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
): Promise<ServiceResponse<any>> {
  try {
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
      return { data: null, error: new Error(error.message || "Failed to invoke edge function") };
    }

    return { data: response, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}