/**
 * User device session service — limit: 1 active session per account.
 *
 * Delegates entirely to the shared generic service with the "user" config.
 */

import { SESSION_CONFIGS } from "@/config/session-limits";
import {
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

export type { DeviceSession as UserDeviceSession, DeviceSessionCheckResult };

const CONFIG = SESSION_CONFIGS.user;

export async function upsertUserDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSession> {
    return upsertDeviceSession(CONFIG, userId, locationLabel);
}

export async function registerUserDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult> {
    return registerDeviceSession(CONFIG, userId, locationLabel);
}

export async function refreshUserDeviceHeartbeatService(userId: string): Promise<void> {
    return refreshDeviceHeartbeat(CONFIG, userId);
}

export async function checkUserDeviceSessionLimitService(
    userId: string,
): Promise<DeviceSessionCheckResult> {
    return checkDeviceSessionLimit(CONFIG, userId);
}

export async function deactivateCurrentUserDeviceSessionService(userId: string): Promise<void> {
    return deactivateCurrentDeviceSession(CONFIG, userId);
}

export async function forceDeactivateCurrentUserDeviceService(): Promise<void> {
    return forceDeactivateCurrentDevice(CONFIG);
}

export async function getActiveUserDeviceSessionsService(userId: string): Promise<DeviceSession[]> {
    return getActiveDeviceSessions(CONFIG, userId);
}
