/**
 * Type definitions for the store-manager device session feature.
 *
 * NOTE: MAX_DEVICE_SESSIONS and SESSION_TIMEOUT_MS are intentionally kept here
 * as re-exports from the central config so existing import sites don't break.
 * Adjust limits in `@/config/session-limits` — not here.
 */
import { SESSION_CONFIGS } from "@/config/session-limits";
import type { DeviceSession } from "@/services/shared/device-session-service";

// Backwards-compatible named re-exports
export const MAX_DEVICE_SESSIONS  = SESSION_CONFIGS.manager.maxSessions;
export const SESSION_TIMEOUT_MS   = SESSION_CONFIGS.manager.timeoutMs;

// Re-export types from the shared service so existing import sites still work
export type { DeviceType, DeviceSessionCheckResult } from "@/services/shared/device-session-service";
export type ManagerDeviceSession = DeviceSession;


export interface DeviceSessionState {
    /** populated when the manager is blocked from logging in */
    blockedSessions: ManagerDeviceSession[];
    /** proactively displayed on the settings page */
    activeSessions: ManagerDeviceSession[];
    isCheckingLimit: boolean;
    /** last trusted server timestamp (ms) fetched during a session check */
    serverTimeMs: number | null;

    setBlockedSessions: (sessions: ManagerDeviceSession[]) => void;
    setActiveSessions: (sessions: ManagerDeviceSession[]) => void;
    setIsCheckingLimit: (v: boolean) => void;
    setServerTimeMs: (ms: number) => void;
    clearBlockedSessions: () => void;
}