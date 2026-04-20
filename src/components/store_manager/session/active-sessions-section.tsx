import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Activity, RefreshCw } from 'lucide-react-native';
import { useDeviceSession } from '@/hooks/store-manager/use-device-session';
import { DeviceSessionCard } from '@/components/store_manager/session/device-session-card';
import DeviceSessionSkeleton from '@/components/skeleton/store_manager/device-session-skeleton';
import { MAX_DEVICE_SESSIONS } from '@/type/store-manager/device-session';
import { useTranslation } from 'react-i18next';

export function ActiveSessionSection() {
    const { activeSessions, fetchActiveSessions } = useDeviceSession();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();

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

    return (
        <View className="overflow-hidden bg-white dark:bg-darkBackground rounded-xl border border-slate-100 dark:border-slate-800 w-full mb-4">
            {/* header row - matching settings item style */}
            <View className="px-2.5 py-3 flex-row items-center border-b border-slate-50 dark:border-slate-800/50">
                <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
                    <Activity size={15} color="#0f172a" className="dark:text-white" />
                </View>

                <View className="flex-1 ml-2">
                    <Text className="text-md font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {t("settings.deviceSessions.title")}
                    </Text>
                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                        {t("settings.deviceSessions.subtitle", { max: MAX_DEVICE_SESSIONS })}
                    </Text>
                </View>
                
                {refreshing ? (
                    <ActivityIndicator size="small" color="#ff6600" />
                ) : (
                    <TouchableOpacity 
                        onPress={handleRefresh}
                        className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg"
                    >
                        <RefreshCw size={14} color="#64748b" className="dark:text-slate-400" />
                    </TouchableOpacity>
                )}
            </View>

            {/* list content */}
            <View className="px-4 py-4">
                {loading ? (
                    <DeviceSessionSkeleton />
                ) : activeSessions.length === 0 ? (
                    <Text className='text-textSecondary dark:text-darkTextSecondary text-sm py-2 font-poppins'>
                        {t("settings.deviceSessions.noSessions")}
                    </Text>
                ): (
                    activeSessions.map((session, index) => (
                        <View key={session.id} className={index > 0 ? "border-t border-border/10 dark:border-borderDark/10 pt-4 mt-4" : ""}>
                            <DeviceSessionCard session={session} />
                        </View>
                    ))
                )}
            </View>
        </View>
    )
}