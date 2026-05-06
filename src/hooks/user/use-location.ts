import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import {
    getCurrentLocation,
    checkLocationPermission,
    requestLocationPermission,
    watchLocation,
    UserLocation,
    LocationPermissionStatus,
    LocationSubscription,
} from '@/services/user/location-service';
import { useLocationStore } from '@/store/user/location-store';

export interface UseLocationReturn {
    location: UserLocation | null;
    permissionStatus: LocationPermissionStatus;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<LocationPermissionStatus>;
    refreshLocation: () => Promise<void>;
}

export function useLocation(userId?: string, syncEnabled: boolean = false) {
    const { globalLocation: location, setGlobalLocation: setLocation } = useLocationStore();
    const watchRef = useRef<LocationSubscription | null>(null);
    const mountedRef = useRef(false);
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stopWatching = () => {
        watchRef.current?.remove();
        watchRef.current = null;
    };

    const startWatching = async () => {
        stopWatching();
        const subscription = await watchLocation(
            (loc) => {
                setLocation(loc);
                setError(null);
                setLoading(false);
            },
            {
                accuracy: Location.Accuracy.Highest,
                timeInterval: 1000,
                distanceInterval: 0,
            }
        );
        if (!mountedRef.current) {
            subscription?.remove();
            return;
        }
        watchRef.current = subscription;
    };

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
            if (status.granted) {
                await refresh();
                await startWatching();
            } else {
                stopWatching();
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "Permission check failed");
            setLoading(false);
        }
    };

    const request = async () => {
        const status = await requestLocationPermission();
        setPermissionStatus(status);
        if (status.granted) {
            await refresh();
            await startWatching();
        }
        return status;
    };

    useEffect(() => {
        mountedRef.current = true;
        checkStatus();

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkStatus();
            }
        });

        return () => {
            mountedRef.current = false;
            subscription.remove();
            stopWatching();
        };
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
