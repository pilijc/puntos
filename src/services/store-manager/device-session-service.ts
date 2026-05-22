/**
 * Store-manager device session service.
 *
 * This is a thin wrapper around the shared generic service that locks
 * the table/limit to the "manager" config entry in `session-limits.ts`.
 *
 * All callers that previously imported from this file continue to work —
 * the public API is identical.
 */

import { SESSION_CONFIGS } from "@/config/session-limits";
import {
    getOrCreateDeviceId,
    registerDeviceSession,
    upsertDeviceSession,
    refreshDeviceHeartbeat,
    checkDeviceSessionLimit,
    deactivateCurrentDeviceSession,
    forceDeactivateCurrentDevice,
    getActiveDeviceSessions,
    type DeviceSession,
    type DeviceSessionCheckResult,
} from "@/services/shared/device-session-service";

const CONFIG = SESSION_CONFIGS.store_manager;

// Re-export types so existing import sites don't need to change
export type { DeviceSession as ManagerDeviceSession, DeviceSessionCheckResult };
export { getOrCreateDeviceId };

// -- Backwards-compatible named exports (matching the original signatures) --

export async function upsertDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSession> {
    return upsertDeviceSession(CONFIG, userId, locationLabel);
}

export async function registerDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult> {
    return registerDeviceSession(CONFIG, userId, locationLabel);
}

export async function refreshDeviceHeartbeatService(userId: string): Promise<void> {
    return refreshDeviceHeartbeat(CONFIG, userId);
}

export async function checkDeviceSessionLimitService(
    userId: string,
): Promise<DeviceSessionCheckResult> {
    return checkDeviceSessionLimit(CONFIG, userId);
}

export async function deactivateCurrentDeviceSessionService(userId: string): Promise<void> {
    return deactivateCurrentDeviceSession(CONFIG, userId);
}

export async function forceDeactivateCurrentDeviceService(): Promise<void> {
    return forceDeactivateCurrentDevice(CONFIG);
}

export async function getActiveDeviceSessionsService(userId: string): Promise<DeviceSession[]> {
    return getActiveDeviceSessions(CONFIG, userId);
}
