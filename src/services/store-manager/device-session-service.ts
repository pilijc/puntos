import { supabase } from "@/supabase/supabase";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { ManagerDeviceSession, DeviceSessionCheckResult, MAX_DEVICE_SESSIONS, SESSION_TIMEOUT_MS } from "@/type/store-manager/device-session";

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

// extracts reliable server time from the HTTP header instead of relying on the device clock
async function getServerTimeMs(): Promise<number> {
    try {
        const url = process.env.EXPO_PUBLIC_API_URL || "";
        const anonKey = process.env.EXPO_PUBLIC_ANON_KEY || "";
        const res = await fetch(`${url}/rest/v1/`, {
            method: "HEAD",
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                "Cache-Control": "no-cache, no-store",
                Pragma: "no-cache",
            },
        });
        const dateStr = res.headers.get("Date");
        if (dateStr) {
            return new Date(dateStr).getTime();
        }
    } catch {
        // fallback to client time ONLY if the network check completely fails
    }
    return Date.now();
}

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
        // use special postgres string literal 'now' to evaluate strictly on backend relative to transaction
        last_active_at: "now", 
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
        .update({ last_active_at: "now" })
        .eq("user_id", userId)
        .eq("device_id", deviceId)
        .eq("is_active", true);
    
    if (error) {
        console.warn("[Device Session] heartbeat failed:", error.message);
    }
}

function filterStaleSessionsAndCleanup(
    sessions: ManagerDeviceSession[], 
    userId: string,
    nowMs: number
): ManagerDeviceSession[] {
    const active: ManagerDeviceSession[] = [];
    const staleDeviceIds: string[] = [];

    for (const session of sessions) {
        const lastActive = new Date(session.last_active_at).getTime();
        if (nowMs - lastActive > SESSION_TIMEOUT_MS) {
            staleDeviceIds.push(session.device_id);
        } else {
            active.push(session);
        }
    }

    if (staleDeviceIds.length > 0) {
        // run lazy cleanup in background without blocking
        supabase
            .from("manager_device_sessions")
            .update({ is_active: false })
            .eq("user_id", userId)
            .in("device_id", staleDeviceIds)
            .then(({ error }) => {
                if (error) console.warn("[Device Session] stale cleanup failed:", error.message);
            });
    }

    return active;
}

export async function checkDeviceSessionLimitService(
    userId: string,
): Promise<DeviceSessionCheckResult> {
    const deviceId = await getOrCreateDeviceId();

    const [ { data: rawSessions, error }, serverTimeMs ] = await Promise.all([
        supabase
            .from("manager_device_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("last_active_at", { ascending: false}),
        getServerTimeMs(),
    ]);
    
    if (error) throw error;

    const sessions = filterStaleSessionsAndCleanup((rawSessions ?? []) as ManagerDeviceSession[], userId, serverTimeMs);

    const thisDeviceAlreadyActive = sessions.some(
        (s) => s.device_id === deviceId,
    );

    if (thisDeviceAlreadyActive || sessions.length < MAX_DEVICE_SESSIONS) {
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
    const [ { data, error }, serverTimeMs ] = await Promise.all([
        supabase
            .from("manager_device_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("last_active_at", { ascending: false }),
        getServerTimeMs(),
    ]);

    if (error) throw error;
    
    return filterStaleSessionsAndCleanup((data ?? []) as ManagerDeviceSession[], userId, serverTimeMs);
}

export async function forceDeactivateCurrentDeviceService(): Promise<void> {
    const deviceId = await getOrCreateDeviceId();
    
    const { error } = await supabase
        .from("manager_device_sessions")
        .update({ is_active: false })
        .eq("device_id", deviceId)
        .eq("is_active", true);

    if (error) {
        console.warn("[DeviceSession] force deactivate failed:", error.message);
    }
}