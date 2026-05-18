/**
 * Route-aware device session helpers.
 *
 * This module maps Expo Router route paths to the correct `SessionRole` and
 * delegates all session operations to the shared generic service via
 * `SESSION_CONFIGS[role]` — no role-specific wrapper imports needed.
 */

import { SESSION_CONFIGS, type SessionRole } from "@/config/session-limits";
import {
    registerDeviceSession,
    forceDeactivateCurrentDevice,
    type DeviceSessionCheckResult,
} from "@/services/shared/device-session-service";

// ---------------------------------------------------------------------------
// Route → role mapping
// ---------------------------------------------------------------------------

export function getDeviceSessionRoleForRoute(route?: string | null): SessionRole | null {
    if (!route) return null;
    if (route === "/(store_manager)" || route.startsWith("/(store_manager)")) return "manager";
    if (route === "/(front_desk)"    || route.startsWith("/(front_desk)"))    return "front_desk";
    if (route === "/(user)"          || route.startsWith("/(user)"))          return "user";
    return null;
}

// ---------------------------------------------------------------------------
// Config / limit helpers
// ---------------------------------------------------------------------------

export function getDeviceSessionLimitForRole(role: SessionRole): number {
    return SESSION_CONFIGS[role].maxSessions;
}

export function getDeviceSessionLimitForRoute(route?: string | null): number | null {
    const role = getDeviceSessionRoleForRoute(route);
    return role ? getDeviceSessionLimitForRole(role) : null;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Atomically check the session limit and register this device for the given role.
 * Delegates directly to `SESSION_CONFIGS[role]` — no role-specific wrapper needed.
 */
export async function registerDeviceSessionForRole(
    role: SessionRole,
    userId: string,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult> {
    return registerDeviceSession(SESSION_CONFIGS[role], userId, locationLabel);
}

/**
 * Resolve the role from the route then call `registerDeviceSessionForRole`.
 * Returns `{ allowed: true, ... }` with `role: null` for routes that have no
 * session limit (e.g. super_admin, onboarding).
 */
export async function registerDeviceSessionForRoute(
    userId: string,
    route?: string | null,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult & { role: SessionRole | null; maxSessions: number | null }> {
    const role = getDeviceSessionRoleForRoute(route);
    if (!role) {
        return { allowed: true, activeSessions: [], role: null, maxSessions: null };
    }

    const result = await registerDeviceSessionForRole(role, userId, locationLabel);
    return {
        ...result,
        role,
        maxSessions: getDeviceSessionLimitForRole(role),
    };
}

// ---------------------------------------------------------------------------
// Sign-out: deactivate this device across all session tables
// ---------------------------------------------------------------------------

/**
 * Mark this device as inactive in ALL role session tables.
 *
 * On sign-out we don't know which role the user had, so we fire a best-effort
 * deactivation against every table. Only the one matching the user's actual
 * role will have a matching row; the others are cheap no-ops.
 *
 * Errors are swallowed individually so one failing table doesn't prevent the
 * others from being cleaned up.
 */
export async function forceDeactivateAllDeviceSessions(): Promise<void> {
    const configs = Object.values(SESSION_CONFIGS);
    await Promise.allSettled(
        configs.map((config) =>
            forceDeactivateCurrentDevice(config).catch((e) =>
                console.warn(`[DeviceSession] force deactivate failed for ${config.table}:`, e),
            ),
        ),
    );
}
