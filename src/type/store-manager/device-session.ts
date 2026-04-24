export const MAX_DEVICE_SESSIONS = 3;
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export type DeviceType = "mobile" | "tablet" | "web";

export interface ManagerDeviceSession {
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
    // true = current device is already in the table and was just refreshed
    // false = the user has >=2 active sessions elsewhere. current devie is blocked
    allowed: boolean;
    activeSessions: ManagerDeviceSession[];
}

export interface DeviceSessionState {
    //populated when the manager is blocked from logging in
    blockedSessions: ManagerDeviceSession[];
    // proactively displayed on the settings page
    activeSessions: ManagerDeviceSession[];
    isCheckingLimit: boolean;
    // last trusted server timestamp (ms) fetched during a session check
    serverTimeMs: number | null;

    setBlockedSessions: (sessions: ManagerDeviceSession[]) => void;
    setActiveSessions: (sessions: ManagerDeviceSession[]) => void;
    setIsCheckingLimit: (v: boolean) => void;
    setServerTimeMs: (ms: number) => void;
    clearBlockedSessions: () => void;
}