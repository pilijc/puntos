/**
 * Front-desk device session service — limit: 1 active session per account.
 *
 * Delegates entirely to the shared generic service with the "front_desk" config.
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

export type { DeviceSession as FrontdeskDeviceSession, DeviceSessionCheckResult };

const CONFIG = SESSION_CONFIGS.front_desk;

export async function upsertFrontdeskDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSession> {
    return upsertDeviceSession(CONFIG, userId, locationLabel);
}

export async function registerFrontdeskDeviceSessionService(
    userId: string,
    locationLabel?: string,
): Promise<DeviceSessionCheckResult> {
    return registerDeviceSession(CONFIG, userId, locationLabel);
}

export async function refreshFrontdeskDeviceHeartbeatService(userId: string): Promise<void> {
    return refreshDeviceHeartbeat(CONFIG, userId);
}

export async function checkFrontdeskDeviceSessionLimitService(
    userId: string,
): Promise<DeviceSessionCheckResult> {
    return checkDeviceSessionLimit(CONFIG, userId);
}

export async function deactivateCurrentFrontdeskDeviceSessionService(userId: string): Promise<void> {
    return deactivateCurrentDeviceSession(CONFIG, userId);
}

export async function forceDeactivateCurrentFrontdeskDeviceService(): Promise<void> {
    return forceDeactivateCurrentDevice(CONFIG);
}

export async function getActiveFrontdeskDeviceSessionsService(userId: string): Promise<DeviceSession[]> {
    return getActiveDeviceSessions(CONFIG, userId);
}
