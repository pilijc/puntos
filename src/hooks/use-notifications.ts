import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { userKeys } from '@/hooks/user/rq';

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

const defaultStatus: NotificationPermissionStatus = {
    granted: false,
    canAskAgain: true,
    status: Notifications.PermissionStatus.UNDETERMINED,
};

const toPermissionStatus = (
    response: Notifications.NotificationPermissionsStatus,
): NotificationPermissionStatus => ({
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
});

export function useNotifications(): UseNotificationsReturn {
    const queryClient = useQueryClient();

    const permissionQuery = useQuery({
        queryKey: userKeys.notificationPermission(),
        queryFn: async () => toPermissionStatus(await Notifications.getPermissionsAsync()),
        staleTime: 10_000,
    });

    const requestPermissionMutation = useMutation({
        mutationFn: async () => toPermissionStatus(await Notifications.requestPermissionsAsync()),
        onSuccess: (status) => {
            queryClient.setQueryData(userKeys.notificationPermission(), status);
        },
        onError: () => {
            queryClient.setQueryData(userKeys.notificationPermission(), {
                granted: false,
                canAskAgain: false,
                status: Notifications.PermissionStatus.DENIED,
            });
        },
    });
    const refetchPermission = permissionQuery.refetch;
    const requestPermissionAsync = requestPermissionMutation.mutateAsync;

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                void refetchPermission();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [refetchPermission]);

    const requestPermission = useCallback(async () => {
        try {
            return await requestPermissionAsync();
        } catch {
            return {
                granted: false,
                canAskAgain: false,
                status: Notifications.PermissionStatus.DENIED,
            };
        }
    }, [requestPermissionAsync]);

    const checkPermissionStatus = useCallback(async () => {
        await refetchPermission();
    }, [refetchPermission]);

    const permissionStatus = permissionQuery.data ?? defaultStatus;
    const error = permissionQuery.error ?? requestPermissionMutation.error;

    return {
        hasPermission: permissionStatus.granted,
        permissionStatus,
        loading: permissionQuery.isPending || requestPermissionMutation.isPending,
        error: error?.message ?? null,
        requestPermission,
        checkPermissionStatus,
    };
}
