import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, } from "react-native";
import { useDeviceSession } from '@/hooks/store-manager/use-device-session';
import { DeviceSessionCard } from '@/components/store_manager/session/device-session-card';

export function ActiveSessionSection() {
    const { activeSessions, fetchActiveSessions } = useDeviceSession();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        await fetchActiveSessions();
    }, [fetchActiveSessions]);

    useEffect(() => {
        loadData().finally(() => setLoading(false));
    }, [loadData]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    if (loading) {
        return (
            <View className='items-center py-6'>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    return (
        <View className='mt-6 px-4'>
            <Text className="text-textPrimary text-base font-poppins-bold mb-1">
                Active Sessions
            </Text>
            <Text className='text-textSecondary text-sm mb-3.5 '>
                You can have up to 2 active sessions at a time.
            </Text>

            <ScrollView
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#6366f1"
                    />
                }
                scrollEnabled={false}
            >
                {activeSessions.length === 0 ? (
                    <Text className='text-textPrimary text-sm text-center py-4'>
                        No active sessions found.
                    </Text>
                ): (
                    activeSessions.map((session) => (
                        <DeviceSessionCard key={session.id} session={session} />
                    ))
                )}
            </ScrollView>
        </View>
    )
}