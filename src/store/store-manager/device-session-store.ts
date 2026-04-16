import { create } from "zustand";
import { DeviceSessionState, ManagerDeviceSession } from "@/type/store-manager/device-session";

export const useDeviceSessionStore = create<DeviceSessionState>((set) => ({
    blockedSessions: [],
    activeSessions: [],
    isCheckingLimit: false,

    setBlockedSessions: (sessions: ManagerDeviceSession[]) => set({ blockedSessions: sessions }),
    setActiveSessions: (sessions: ManagerDeviceSession[]) => set({ activeSessions: sessions }),

    setIsCheckingLimit: (v: boolean) => set({ isCheckingLimit: v }),

    clearBlockedSessions: () => set({ blockedSessions: [] }),
}));