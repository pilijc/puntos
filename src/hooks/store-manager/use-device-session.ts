import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/supabase/supabase";
import { deactivateCurrentDeviceSessionService, refreshDeviceHeartbeatService, getActiveDeviceSessionsService } from "@/services/store-manager/device-session-service";
import { getDeviceSessionLimitForRole, getDeviceSessionLimitForRoute, registerDeviceSessionForRole, registerDeviceSessionForRoute } from "@/services/shared/device-session-route-service";
import { useDeviceSessionStore } from "@/store/store-manager/device-session-store";
import { ManagerDeviceSession } from "@/type/store-manager/device-session";
import type { SessionRole } from "@/config/session-limits";

export function useDeviceSession(userId?: string) {
    const {
        blockedSessions,
        activeSessions,
        isCheckingLimit,
        setBlockedSessions,
        setActiveSessions,
        setIsCheckingLimit,
        setServerTimeMs,
        clearBlockedSessions,
    } = useDeviceSessionStore();

    // single canonical heartbeat effect — activates only when userId is provided.
    // covers both: foreground transitions via AppState and long continuous sessions via setInterval.
    // no manual startHeartbeat callback is needed — pass userId to useDeviceSession() at the call site.
    useEffect(() => {
        if (!userId) return;

        const pulseHeartbeat = () => {
            void refreshDeviceHeartbeatService(userId);
        };

        // 1. update heartbeat when app comes to foreground
        const handler = (state: AppStateStatus) => {
            if (state === "active") pulseHeartbeat();
        };
        const sub = AppState.addEventListener("change", handler);

        // 2. pulse continuously every 1 minute while the app is actively open
        // this prevents the 10-min timeout from incorrectly killing an active user's session
        const intervalId = setInterval(pulseHeartbeat, 1 * 60 * 1000);

        return () => {
            sub.remove();
            clearInterval(intervalId);
        };
    }, [userId]);

    const checkAndRegisterSession = useCallback(
        async (
            uid: string,
            locationLabel?: string,
            role: SessionRole = "store_manager",
        ): Promise<{
            allowed: boolean;
            activeSessions: ManagerDeviceSession[];
            maxSessions: number | null;
        }> => {
            setIsCheckingLimit(true);
            try {
                const result = await registerDeviceSessionForRole(role, uid, locationLabel);

                if (result.allowed) {
                    clearBlockedSessions();
                    return { allowed: true, activeSessions: [], maxSessions: null };
                } else {
                    setBlockedSessions(result.activeSessions);
                    return {
                        allowed: false,
                        activeSessions: result.activeSessions,
                        maxSessions: getDeviceSessionLimitForRole(role),
                    };
                }
            } finally {
                setIsCheckingLimit(false);
            }
        },
        [clearBlockedSessions, setBlockedSessions, setIsCheckingLimit],
    );

    const signOutCurrentDevice = useCallback(async (uid: string) => {
        await deactivateCurrentDeviceSessionService(uid);
    }, []);

    const fetchActiveSessions = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const data = await getActiveDeviceSessionsService(user.id);
            setActiveSessions(data);
            // store the approximate server time captured at the moment of the fetch so
            // DeviceSessionCard can display "last active" relative to it instead of Date.now()
            setServerTimeMs(Date.now());
        } catch {
            // Swallowed to prevent app crash if network is offline or request fails
        }
    }, [setActiveSessions, setServerTimeMs]);

    const validateHomeRouteSession = useCallback(async (homeRoute?: string, userIdOverride?: string) => {
        let userId = userIdOverride;
        if (!userId) {
            const { data: { session } } = await supabase.auth.getSession();
            userId = session?.user?.id;
        }
        if (!userId) return false;

        setIsCheckingLimit(true);
        try {
            const sessionCheck = await registerDeviceSessionForRoute(userId, homeRoute);
            if (sessionCheck.allowed) {
                clearBlockedSessions();
                return true;
            }

            setBlockedSessions(sessionCheck.activeSessions);
            return false;
        } finally {
            setIsCheckingLimit(false);
        }
    }, [clearBlockedSessions, setBlockedSessions, setIsCheckingLimit]);

    return {
        blockedSessions,
        activeSessions,
        isCheckingLimit,
        checkAndRegisterSession,
        validateHomeRouteSession,
        getDeviceSessionLimitForRoute,
        signOutCurrentDevice,
        fetchActiveSessions,
    };
}
