import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
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
                <ActivityIndicator color="#ff6600" />
            </View>
        );
    }

    return (
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 w-full mx-auto mt-4 px-4 overflow-hidden mb-4">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-textPrimary text-base font-poppins-semibold">
                    Active Sessions
                </Text>
                
                {refreshing ? (
                    <ActivityIndicator size="small" color="#ff6600" />
                ) : (
                    <TouchableOpacity onPress={handleRefresh}>
                        <Text className="text-primary font-poppins text-xs font-poppins-semibold">
                            Refresh
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text className='text-textPrimary text-xs mb-5 font-poppins'>
                You can have up to 2 active sessions at a time.
            </Text>

            <View className="w-full">
                {activeSessions.length === 0 ? (
                    <Text className='text-textSecondary text-sm py-4 font-poppins'>
                        No active sessions found.
                    </Text>
                ): (
                    activeSessions.map((session, index) => (
                        <View key={session.id} className={index > 0 ? "border-t border-border pt-3 mt-3" : ""}>
                            <DeviceSessionCard session={session} />
                        </View>
                    ))
                )}
            </View>
        </View>
    )
}