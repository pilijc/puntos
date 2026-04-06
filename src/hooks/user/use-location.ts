import { useState, useEffect } from 'react';
import { create } from 'zustand';
import * as Location from 'expo-location';
import { getCurrentLocation, checkLocationPermission, requestLocationPermission, UserLocation, LocationPermissionStatus } from '@/services/user/location-service';
import { syncLocationService } from "@/services/user/settings-service";

export interface UseLocationReturn {
    location: UserLocation | null;
    permissionStatus: LocationPermissionStatus;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<void>;
    refreshLocation: () => Promise<void>;
}

export const useLocationStore = create<{
  globalLocation: UserLocation | null;
  setGlobalLocation: (loc: UserLocation | null) => void;
}>((set) => ({
  globalLocation: null,
  setGlobalLocation: (loc) => set({ globalLocation: loc }),
}));

export function useLocation(userId?: string, syncEnabled: boolean = false) {
    const { globalLocation: location, setGlobalLocation: setLocation } = useLocationStore();
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = async () => {
        try {
            const status = await checkLocationPermission();
            setPermissionStatus(status);
            if (status.granted) await refresh();
            else setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Permission check failed');
            setLoading(false);
        }
    };

    const request = async () => {
        const status = await requestLocationPermission();
        setPermissionStatus(status);
        if (status.granted) await refresh();
    };

    const refresh = async () => {
        setLoading(true);
        const loc = await getCurrentLocation();
        if (loc) setLocation(loc);
        setLoading(false);
    };

    // Initial check on mount
    useEffect(() => {
        checkStatus();
    }, []);

    // Background Sync Logic
    useEffect(() => {
        if (!syncEnabled || !userId) return;

        const syncToDB = async () => {
            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    await syncLocationService(userId, loc.latitude, loc.longitude);
                }
            } catch (e) {
                console.error("Location sync failed:", e);
            }
        };

        syncToDB();
        const intervalId = setInterval(syncToDB, 60000);
        return () => clearInterval(intervalId);
    }, [syncEnabled, userId]);

    return {
        location,
        permissionStatus,
        loading,
        error,
        requestPermission: request,
        refreshLocation: refresh
    };
}
