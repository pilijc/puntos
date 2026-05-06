import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';

export interface NotificationPermissionStatus {
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
}

export interface UseNotificationsReturn {
    hasPermission: boolean;
    permissionStatus: NotificationPermissionStatus;
    loading: boolean;
    error: string | null;
    requestPermission: () => Promise<NotificationPermissionStatus>;
    checkPermissionStatus: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
        granted: false,
        canAskAgain: true,
        status: Notifications.PermissionStatus.UNDETERMINED,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const applyPermissionStatus = (response: Notifications.NotificationPermissionsStatus) => {
        const nextStatus = {
            granted: response.granted,
            canAskAgain: response.canAskAgain,
            status: response.status,
        };
        setHasPermission(nextStatus.granted);
        setPermissionStatus(nextStatus);
        return nextStatus;
    };

    const checkPermissionStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await Notifications.getPermissionsAsync();
            applyPermissionStatus(response);
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
            const response = await Notifications.requestPermissionsAsync();
            return applyPermissionStatus(response);
        } catch (err: any) {
            setError(err.message || 'Failed to request notification permission');
            const deniedStatus = {
                granted: false,
                canAskAgain: false,
                status: Notifications.PermissionStatus.DENIED,
            };
            setHasPermission(false);
            setPermissionStatus(deniedStatus);
            return deniedStatus;
        } finally {
            setLoading(false);
        }
    };

    return {
        hasPermission,
        permissionStatus,
        loading,
        error,
        requestPermission,
        checkPermissionStatus,
    };
}
