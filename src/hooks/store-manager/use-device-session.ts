import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/supabase/supabase";
import { checkDeviceSessionLimitService, deactivateCurrentDeviceSessionService, upsertDeviceSessionService, refreshDeviceHeartbeatService, getActiveDeviceSessionsService } from "@/services/store-manager/device-session-service";
import { useDeviceSessionStore } from "@/store/store-manager/device-session-store";
import { ManagerDeviceSession } from "@/type/store-manager/device-session";

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
            refreshDeviceHeartbeatService(userId).catch(() => {});
        };

        // 1. update heartbeat when app comes to foreground
        const handler = (state: AppStateStatus) => {
            if (state === "active") pulseHeartbeat();
        };
        const sub = AppState.addEventListener("change", handler);

        // 2. pulse continuously every 5 minutes while the app is actively open
        // this prevents the 15-min timeout from incorrectly killing an active user's session
        const intervalId = setInterval(pulseHeartbeat, 5 * 60 * 1000);

        return () => {
            sub.remove();
            clearInterval(intervalId);
        };
    }, [userId]);

    const checkAndRegisterSession = useCallback(
        async (
            uid: string,
            locationLabel?: string,
        ): Promise<{
            allowed: boolean;
            activeSessions: ManagerDeviceSession[];
        }> => {
            setIsCheckingLimit(true);
            try {
                const result = await checkDeviceSessionLimitService(uid);

                if (result.allowed) {
                    await upsertDeviceSessionService(uid, locationLabel);
                    clearBlockedSessions();
                    return { allowed: true, activeSessions: [] };
                } else {
                    setBlockedSessions(result.activeSessions);
                    return { allowed: false, activeSessions: result.activeSessions };
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
        } catch (error) {
            console.error("Failed to fetch active sessions: ", error);
        }
    }, [setActiveSessions, setServerTimeMs]);

    const validateHomeRouteSession = useCallback(async (homeRoute?: string) => {
        if (homeRoute && (homeRoute === "/(store_manager)" || homeRoute.startsWith("/(store_manager)"))) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const sessionCheck = await checkAndRegisterSession(user.id);
                return sessionCheck.allowed;
            }
        }
        return true;
    }, [checkAndRegisterSession]);

    return {
        blockedSessions,
        activeSessions,
        isCheckingLimit,
        checkAndRegisterSession,
        validateHomeRouteSession,
        signOutCurrentDevice,
        fetchActiveSessions,
    };
}