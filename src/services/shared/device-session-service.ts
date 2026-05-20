/**
 * Generic device session service.
 *
 * All session logic (upsert, heartbeat, limit check, stale cleanup, deactivation)
 * lives here.  Callers supply a `RoleSessionConfig` from `@/config/session-limits`
 * so the same code runs for manager, front_desk, and user — only the Supabase
 * table and the max-session limit differ.
 */

import { supabase } from "@/supabase/supabase";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import type { RoleSessionConfig } from "@/config/session-limits";

// --------------------------------------------------------------------------
// Shared types
// --------------------------------------------------------------------------

export type DeviceType = "mobile" | "tablet" | "web";

export interface DeviceSession {
    id: string;
    user_id: string;
    device_id: string;
    device_name: string | null;
    device_model: string | null;
    device_type: DeviceType;
    location_label: string | null;
    last_active_at: string;
    created_at: string;
    is_active: boolean;
}

export interface DeviceSessionCheckResult {
    /** true  = this device is already registered OR there is room for one more */
    allowed: boolean;
    /** populated only when allowed === false */
    activeSessions: DeviceSession[];
}

type RegisterDeviceSessionRpcResult = {
    allowed?: boolean;
    activeSessions?: DeviceSession[];
    active_sessions?: DeviceSession[];
};

// --------------------------------------------------------------------------
// Device identity helpers  (stable across app reinstalls on iOS, encrypted on Android)
// --------------------------------------------------------------------------

const DEVICE_ID_KEY = "puntos_device_id";

export async function getOrCreateDeviceId(): Promise<string> {
    if (Platform.OS === "web") {
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

function resolveDeviceType(): DeviceType {
    if (Platform.OS === "web") return "web";
    if (Device.deviceType === Device.DeviceType.TABLET) return "tablet";
    return "mobile";
}

function resolveDeviceModel(): string {
    if (Platform.OS === "web") {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Web Browser";
        if (ua.includes("Edg/") || ua.includes("EdgA/") || ua.includes("EdgiOS/")) return "Edge Browser";
        if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera Browser";
        if (ua.includes("SamsungBrowser/")) return "Samsung Browser";
        if (ua.includes("YaBrowser/")) return "Yandex Browser";
        if (ua.includes("Chrome/")) return "Chrome Browser";
        if (ua.includes("Firefox/")) return "Firefox Browser";
        if (ua.includes("Safari/")) return "Safari Browser";
        return "Web Browser";
    }
    return Device.modelName ?? Device.deviceName ?? "Unknown Device";
}

// --------------------------------------------------------------------------
// Trusted server time (avoids relying on the device clock)
// --------------------------------------------------------------------------

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
        if (dateStr) return new Date(dateStr).getTime();
    } catch {
        // fall back to device clock only when the network is unreachable
    }
    return Date.now();
}

// --------------------------------------------------------------------------
// Core service functions
// --------------------------------------------------------------------------

/**
 * Upsert a session row for this device without limit-checking.
 *
 * @internal Prefer `registerDeviceSession` which atomically checks the limit
 * and upserts in a single RPC call. This function is kept for the non-atomic
 * fallback path and for callers that have already checked the limit separately.
 */
export async function upsertDeviceSession(
    config: RoleSessionConfig,
    userId: string,
    locationLabel?: string,
): Promise<DeviceSession> {
    const deviceId    = await getOrCreateDeviceId();
    const deviceType  = resolveDeviceType();
    const deviceModel = resolveDeviceModel();

    const { data, error } = await supabase
        .from(config.table)
        .upsert(
            {
                user_id: userId,
                device_id: deviceId,
                device_type: deviceType,
                device_model: deviceModel,
                location_label: locationLabel ?? null,
                last_active_at: "now",
                is_active: true,
            },
            { onConflict: "user_id,device_id" },
        )
        .select()
        .single();

    if (error) throw error;
    return data as DeviceSession;
}

function isMissingRegisterRpcError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return (
        error.code === "PGRST202" ||
        error.code === "42883" ||
        /register_device_session/i.test(error.message ?? "")
    );
}

function normalizeRegisterResult(data: unknown): DeviceSessionCheckResult {
    const result =
        typeof data === "string"
            ? (JSON.parse(data) as RegisterDeviceSessionRpcResult)
            : (data as RegisterDeviceSessionRpcResult | null);
    const activeSessions = result?.activeSessions ?? result?.active_sessions;

    return {
        allowed: result?.allowed === true,
        // The RPC returns the existing active sessions as a JSON array using the
        // same snake_case column names as the device session tables, which matches
        // the DeviceSession interface directly. If the RPC is missing or returns
        // null, we default to an empty array (the fallback path handles this).
        activeSessions: Array.isArray(activeSessions) ? activeSessions : [],
    };
}

/**
 * Atomically check the configured limit and register this device.
 *
 * The preferred path is the `register_device_session` RPC from
 * `sql/device_session_limit_migration.sql`, which serializes registrations
 * per account/role. A compatibility fallback keeps existing manager behavior
 * working before that migration is applied, but the RPC is required for strict
 * one-device enforcement under concurrent logins.
 */
export async function registerDeviceSession(
    config: RoleSessionConfig,
    userId: string,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult> {
    const deviceId = await getOrCreateDeviceId();
    const deviceType = resolveDeviceType();
    const deviceModel = resolveDeviceModel();

    const { data, error } = await supabase.rpc("register_device_session", {
        p_role: config.role,
        p_user_id: userId,
        p_device_id: deviceId,
        p_device_type: deviceType,
        p_device_model: deviceModel,
        p_location_label: locationLabel ?? null,
    });

    if (!error) {
        return normalizeRegisterResult(data);
    }

    if (!isMissingRegisterRpcError(error)) {
        throw error;
    }

    const result = await checkDeviceSessionLimit(config, userId);
    if (result.allowed) {
        await upsertDeviceSession(config, userId, locationLabel);
    }
    return result;
}

/** Update last_active_at for this device (heartbeat ping). */
export async function refreshDeviceHeartbeat(
    config: RoleSessionConfig,
    userId: string,
): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    const { error } = await supabase
        .from(config.table)
        .update({ last_active_at: "now" })
        .eq("user_id", userId)
        .eq("device_id", deviceId)
        .eq("is_active", true);


}

/** Mark stale sessions inactive in the background and return only the live ones. */
function filterStaleAndCleanup(
    config: RoleSessionConfig,
    sessions: DeviceSession[],
    userId: string,
    nowMs: number,
): DeviceSession[] {
    const active: DeviceSession[] = [];
    const staleIds: string[]      = [];

    for (const s of sessions) {
        const lastActive = new Date(s.last_active_at).getTime();
        if (nowMs - lastActive > config.timeoutMs) {
            staleIds.push(s.device_id);
        } else {
            active.push(s);
        }
    }

    if (staleIds.length > 0) {
        supabase
            .from(config.table)
            .update({ is_active: false })
            .eq("user_id", userId)
            .in("device_id", staleIds)
            .then(undefined, () => {
                // Ignore background eviction failure
            });
    }

    return active;
}

/**
 * Returns whether this device may proceed.
 *
 * - allowed = true  if the device already has a registered active session, OR
 *                   if the total active session count is below the configured limit.
 * - allowed = false if the limit is already reached by other devices.
 */
export async function checkDeviceSessionLimit(
    config: RoleSessionConfig,
    userId: string,
): Promise<DeviceSessionCheckResult> {
    const deviceId = await getOrCreateDeviceId();

    const [{ data: rawSessions, error }, serverTimeMs] = await Promise.all([
        supabase
            .from(config.table)
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .neq("device_id", `cache-bust-${Date.now()}`) // Prevent React Native GET caching
            .order("last_active_at", { ascending: false }),
        getServerTimeMs(),
    ]);

    if (error) throw error;

    const sessions = filterStaleAndCleanup(
        config,
        (rawSessions ?? []) as DeviceSession[],
        userId,
        serverTimeMs,
    );

    const alreadyActive = sessions.some((s) => s.device_id === deviceId);

    if (alreadyActive || sessions.length < config.maxSessions) {
        return { allowed: true, activeSessions: [] };
    }

    return { allowed: false, activeSessions: sessions };
}

/** Mark THIS device's session inactive (e.g. on logout). */
export async function deactivateCurrentDeviceSession(
    config: RoleSessionConfig,
    userId: string,
): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    const { error } = await supabase
        .from(config.table)
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("device_id", deviceId);


}

/** Mark THIS device inactive regardless of user_id (used during sign-out when userId may be unknown). */
export async function forceDeactivateCurrentDevice(config: RoleSessionConfig): Promise<void> {
    const deviceId = await getOrCreateDeviceId();

    const { error } = await supabase
        .from(config.table)
        .update({ is_active: false })
        .eq("device_id", deviceId)
        .eq("is_active", true);


}

/** Fetch all currently active sessions for this user (used by settings / profile UIs). */
export async function getActiveDeviceSessions(
    config: RoleSessionConfig,
    userId: string,
): Promise<DeviceSession[]> {
    const [{ data, error }, serverTimeMs] = await Promise.all([
        supabase
            .from(config.table)
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .neq("device_id", `cache-bust-${Date.now()}`)
            .order("last_active_at", { ascending: false }),
        getServerTimeMs(),
    ]);

    if (error) throw error;

    return filterStaleAndCleanup(config, (data ?? []) as DeviceSession[], userId, serverTimeMs);
}
