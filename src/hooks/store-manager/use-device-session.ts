import { useCallback } from "react";
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
        clearBlockedSessions,
    } = useDeviceSessionStore();

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
                    return { allowed: false, activeSessions: result.activeSessions }
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

    const startHeartbeat = useCallback((uid: string) => {
        const handler = (state: AppStateStatus) => {
            if (state === "active") {
                refreshDeviceHeartbeatService(uid).catch(() => {});
            }
        };
        const sub = AppState.addEventListener("change", handler);
    }, []);

    const fetchActiveSessions = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const data = await getActiveDeviceSessionsService(user.id);
            setActiveSessions(data);
        } catch (error) {
            console.error("Failed to fetch active sessions: ", error);
        }
    }, [setActiveSessions]);

    return {
        blockedSessions,
        activeSessions,
        isCheckingLimit,
        checkAndRegisterSession,
        signOutCurrentDevice,
        startHeartbeat,
        fetchActiveSessions,
    }
}