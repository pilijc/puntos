/**
 * Central configuration for device session limits per role.
 *
 * Each role maps to:
 *   - table         : the Supabase table that holds that role's device sessions
 *   - maxSessions   : how many concurrent active sessions are allowed per account
 *   - timeoutMs     : how long with no heartbeat before a session is considered stale
 *
 * Changing a limit here is the ONLY thing needed to adjust it —
 * the service layer reads this config at runtime so no hardcoded magic numbers live in service files.
 */

export type SessionRole = "manager" | "front_desk" | "user";

export type RoleSessionConfig = {
    role: SessionRole;
    table: string;
    maxSessions: number;
    timeoutMs: number;
};

export const SESSION_CONFIGS = {
    manager: {
        role: "manager",
        table: "manager_device_sessions",
        maxSessions: 3,
        timeoutMs: 10 * 60 * 1000, // 10 minutes
    },
    front_desk: {
        role: "front_desk",
        table: "frontdesk_device_sessions",
        maxSessions: 1,
        timeoutMs: 10 * 60 * 1000,
    },
    user: {
        role: "user",
        table: "user_device_sessions",
        maxSessions: 1,
        timeoutMs: 10 * 60 * 1000,
    },
} as const satisfies Record<SessionRole, RoleSessionConfig>;
