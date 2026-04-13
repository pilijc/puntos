import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getCurrentLocation, checkLocationPermission, requestLocationPermission, UserLocation, LocationPermissionStatus } from '@/services/user/location-service';
import { useLocationStore } from '@/store/user/location-store';

export interface UseLocationReturn {
    location: UserLocation | null;
    permissionStatus: LocationPermissionStatus;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<void>;
    refreshLocation: () => Promise<void>;
}

export function useLocation(userId?: string, syncEnabled: boolean = false) {
    const { globalLocation: location, setGlobalLocation: setLocation } = useLocationStore();
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        const loc = await getCurrentLocation();
        if (loc) setLocation(loc);
        setLoading(false);
    };

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

    useEffect(() => {
        checkStatus();
    }, []);

    return {
        location,
        permissionStatus,
        loading,
        error,
        requestPermission: request,
        refreshLocation: refresh,
    };
}