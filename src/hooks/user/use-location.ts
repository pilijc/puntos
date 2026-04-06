import { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import * as Location from 'expo-location';
import { getCurrentLocation, checkLocationPermission, requestLocationPermission, UserLocation, LocationPermissionStatus } from '@/services/user/location-service';
import { syncLocationService, clearLocationService } from "@/services/user/settings-service";

export interface UseLocationReturn {
    location: UserLocation | null;
    permissionStatus: LocationPermissionStatus;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<void>;
    refreshLocation: () => Promise<void>;
}

//global store --- holds the last known gps coords in memory
export const useLocationStore = create<{
    globalLocation: UserLocation | null;
    setGlobalLocation: (loc: UserLocation | null) => void;
}>((set) => ({
    globalLocation: null,
    setGlobalLocation: (loc) => set ({ globalLocation: loc}),
}));

//location expiry, how long until we consider a location stale and clear it (3mins)
const LOCATION_EXPIRY_MS = 3 * 60 * 1000;
// send location to db (1min interval)
const SYNC_INTERVAL_MS = 60 * 1000;

export function useLocation(userId?: string, syncEnabled: boolean = false) {
    const { globalLocation: location, setGlobalLocation: setLocation } = useLocationStore();
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastSyncTimeRef = useRef<number | null>(null);

    // --- permission & location funtcions ---
    const checkStatus = async () => {
        try {
            const status = await checkLocationPermission();
            setPermissionStatus(status);
            if (status.granted) await refresh();
            else setLoading(false);
        } catch (err: any) {
            setError(err.message || "Permission check failed");
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

    useEffect(() => {
        checkStatus();
    }, []);

    // --- sync logic ---
    useEffect(() => {
        if (!userId) return;

        // case 1: if location is disabled, clear it from db
        if (!syncEnabled) {
            clearLocationService(userId).catch((e) => {
                console.error("Failed to clear location from DB:", e);
            });
            return;
        }

        // case 2: location enabled then start syncing every 1min
        const syncToDB = async () => {
            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    await syncLocationService(userId, loc.latitude, loc.longitude);
                    //record of last sucessful sync
                    lastSyncTimeRef.current = Date.now();
                }
            } catch (e) {
                console.error("Location sync failed: ", e);
            }
        };

        syncToDB();
        const syncIntervalId = setInterval(syncToDB, SYNC_INTERVAL_MS);

        // EXPIRE WATCHER: checks every 30secs if the last sync was too long ago
        // waht if scenario: phone turns off after leaving a store
        // when phone comes back on, if >3mins have passed, clear db location
        const expiryIntervalId = setInterval(async () => {
            if (lastSyncTimeRef.current === null) return;
            
            const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
            if (timeSinceLastSync > LOCATION_EXPIRY_MS) {
                console.log("Location expired. Clearing from DB.");
                try {
                    await clearLocationService(userId);
                    lastSyncTimeRef.current = null;
                } catch (e) {
                    console.error("Failed to expire location:", e);
                }
            }
        }, 30 * 1000);

        return () => {
            clearInterval(syncIntervalId);
            clearInterval(expiryIntervalId);
            clearLocationService(userId).catch(() => {});
        };
    }, [syncEnabled, userId]);

    return {
        location,
        permissionStatus,
        loading,
        error,
        requestPermission: request,
        refreshLocation: refresh,
    };
}