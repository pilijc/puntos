export const MAX_DEVICE_SESSIONS = 2;
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

    setBlockedSessions: (sessions: ManagerDeviceSession[]) => void;
    setActiveSessions: (sessions: ManagerDeviceSession[]) => void;
    setIsCheckingLimit: (v: boolean) => void;
    clearBlockedSessions: () => void;
}