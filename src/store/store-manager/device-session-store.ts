import { create } from "zustand";
import { DeviceSessionState, ManagerDeviceSession } from "@/type/store-manager/device-session";

export const useDeviceSessionStore = create<DeviceSessionState>((set) => ({
    blockedSessions: [],
    activeSessions: [],
    isCheckingLimit: false,
    serverTimeMs: null,

    setBlockedSessions: (sessions: ManagerDeviceSession[]) => set({ blockedSessions: sessions }),
    setActiveSessions: (sessions: ManagerDeviceSession[]) => set({ activeSessions: sessions }),

    setIsCheckingLimit: (v: boolean) => set({ isCheckingLimit: v }),
    setServerTimeMs: (ms: number) => set({ serverTimeMs: ms }),

    clearBlockedSessions: () => set({ blockedSessions: [] }),
}));