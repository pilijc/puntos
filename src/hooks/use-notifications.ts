import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';

export interface UseNotificationsReturn {
    hasPermission: boolean;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<void>;
    checkPermissionStatus: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkPermissionStatus = useCallback(async () => {
        try {
            setLoading(true);
            const { status } = await Notifications.getPermissionsAsync();
            setHasPermission(status === 'granted');
        } catch (err: any) {
            setError(err.message || 'Failed to check notification permission');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkPermissionStatus();

        // Check if permissions changed when app returns to active state
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkPermissionStatus();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkPermissionStatus]);

    const requestPermission = async () => {
        try {
            setLoading(true);
            setError(null);
            const { status } = await Notifications.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        } catch (err: any) {
            setError(err.message || 'Failed to request notification permission');
        } finally {
            setLoading(false);
        }
    };

    return {
        hasPermission,
        loading,
        error,
        requestPermission,
        checkPermissionStatus,
    };
}
