import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { ManagerDeviceSession, DeviceSessionCheckResult } from "@/type/store-manager/device-session";

const supabase = createClient(
    process.env.EXPO_PUBLIC_API_URL!,
    process.env.EXPO_PUBLIC_SERVICE_ROLE_KEY!,
);

const MAX_SESSIONS = 2;

const DEVICE_ID_KEY = "puntos_device_id";

// -- creates a stable uuid on first launch and stores it via securestore --
// using SecureStore instead of AsyncStorage because it survives
// app reinstallss on ios (stored in keychain) and is encrypted in android :)
export async function getOrCreateDeviceId(): Promise<string> {
    if(Platform.OS === "web") {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = Crypto.randomUUID();
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
        id = Crypto.randomUUID();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
}

// expo-device gives us 'Device.deviceType' on native
function resolveDeviceType(): "mobile" | "tablet" | "web" {
    if (Platform.OS === "web")  return "web";
    // enum: UNKNOWN=0, PHONE=1, TABLET=2, DESKTOP=3, TV=4
    if (Device.deviceType === Device.DeviceType.TABLET) return "tablet";
    return "mobile";
}

function resolveDeviceModel(): string {
    if (Platform.OS === "web") {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Web Browser";
        if (ua.includes("Chrome")) return "Chrome Browser";
        if (ua.includes("Firefox")) return "Firefox Browser";
        if (ua.includes("Safari")) return "Safari Browser";
        return "Web Browser";
    }
    return Device.modelName ?? Device.deviceName ?? "Unknown Device";
}

// ------ core services 

export async function upsertDeviceSessionService(
    userId: string,
    locationLabel?: string,
) : Promise<ManagerDeviceSession> {
    const deviceId = await getOrCreateDeviceId();
    const deviceType = resolveDeviceType();
    const deviceModel = resolveDeviceModel();

    const payload = {
        user_id: userId,
        device_id: deviceId,
        device_type: deviceType,
        device_model: deviceModel,
        location_label: locationLabel ?? null,
        last_active_at: new Date().toISOString(),
        is_active: true,
    };

    const { data, error } = await supabase
        .from("manager_device_sessions")
        .upsert(payload, {onConflict: "user_id,device_id"})
        .select()
        .single();
    
    if (error) throw error;
    return data as ManagerDeviceSession;
}

//refreshes the last_active_at timestamp for the current device
export async function refreshDeviceHeartbeatService(
    userId: string,
): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    const { error } = await supabase
        .from("manager_device_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("device_id", deviceId)
        .eq("is_active", true);
    
    if (error) {
        console.warn("[Device Session] heartbeat failed:", error.message);
    }
}

export async function checkDeviceSessionLimitService(
    userId: string,
): Promise<DeviceSessionCheckResult> {
    const deviceId = await getOrCreateDeviceId();

    const { data: activeSessions, error } = await supabase
        .from("manager_device_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("last_active_at", { ascending: false});
    
    if (error) throw error;

    const sessions = (activeSessions ?? []) as ManagerDeviceSession[];

    const thisDeviceAlreadyActive = sessions.some(
        (s) => s.device_id === deviceId,
    );

    if (thisDeviceAlreadyActive || sessions.length < MAX_SESSIONS) {
        return { allowed: true, activeSessions: [] };
    } 

    return { allowed: false, activeSessions: sessions };
}

export async function deactivateCurrentDeviceSessionService(
    userId: string,
): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    const { error } = await supabase
        .from("manager_device_sessions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("device_id", deviceId);

    if (error) {
        console.warn("[DeviceSession] deactivate failed:", error.message);
    }
}

export async function getActiveDeviceSessionsService(
    userId: string,
): Promise<ManagerDeviceSession[]> {
    const { data, error } = await supabase
        .from("manager_device_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("last_active_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ManagerDeviceSession[];
}