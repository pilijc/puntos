import React from 'react';
import { View, Text } from '@/tw';
import { Smartphone, Tablet, Monitor, MapPin, Clock } from 'lucide-react-native';
import { ManagerDeviceSession } from '@/type/store-manager/device-session';
import { useTranslation } from 'react-i18next';

function DeviceIcon({ type }: { type: string }) {
    if (type === "tablet") {
        return (
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-teal-50 dark:bg-teal-900/40">
                <Tablet size={15} color="#0d9488" className="dark:text-teal-400" />
            </View>
        );
    }

    if (type === "web") {
        return (
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-orange-50 dark:bg-orange-900/40">
                <Monitor size={15} color="#f97316" className="dark:text-orange-400" />
            </View>
        );
    }
    
    return (
        <View className="w-10 h-10 rounded-xl items-center justify-center bg-indigo-50 dark:bg-indigo-900/40">
            <Smartphone size={15} color="#6366f1" className="dark:text-indigo-400" />
        </View>
    );
}

function resolveDisplayName(session: ManagerDeviceSession, t: any): string {
    if (session.device_name) return session.device_name;
    if (session.device_model) return session.device_model;
    return session.device_type === "web" ? t("settings.deviceSessions.webBrowser") : t("settings.deviceSessions.unknownDevice");
}

function timeAgo(isoString: string, t: any): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t("settings.deviceSessions.justNow");
    if (minutes < 60) return t("settings.deviceSessions.minutesAgo", { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("settings.deviceSessions.hoursAgo", { hours });
    const days = Math.floor(hours / 24);
    return t("settings.deviceSessions.daysAgo", { days }); 
}

interface DeviceSessionCardProps {
    session: ManagerDeviceSession;
}

export function DeviceSessionCard({ session }: DeviceSessionCardProps) {
    const { t } = useTranslation();
    const displayName = resolveDisplayName(session, t);

    return (
        <View className='flex-row items-center gap-3 w-full bg-transparent py-1'>
            <DeviceIcon type={session.device_type} />

            <View className="flex-1 gap-1">
                <Text 
                    className='text-textPrimary dark:text-darkTextPrimary text-sm font-poppins-semibold' 
                    numberOfLines={1}
                >
                    {displayName}
                </Text>

                {/* location if available */}
                {session.location_label ? (
                    <View className='flex-row items-center gap-1'>
                        <MapPin size={12} color="#8b8d98" className="dark:text-slate-500" />
                        <Text className="text-textSecondary dark:text-darkTextSecondary text-xs font-poppins">
                            {session.location_label}
                        </Text>
                    </View>
                ) : null}

                {/* last active */}
                <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#8b8d98" className="dark:text-slate-500" />
                    <Text className='text-textSecondary dark:text-darkTextSecondary text-xs font-poppins'>
                        {t("settings.deviceSessions.lastActive", { time: timeAgo(session.last_active_at, t) })}
                    </Text>
                </View>
            </View>
        </View>
    );
}