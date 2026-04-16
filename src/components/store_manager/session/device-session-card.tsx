import React from 'react';
import { View, Text } from '@/tw';
import { Smartphone, Tablet, Monitor, MapPin, Clock } from 'lucide-react-native';
import { ManagerDeviceSession } from '@/type/store-manager/device-session';

function DeviceIcon({ type }: { type: string }) {
    if (type === "tablet") {
        return (
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-teal-50">
                <Tablet size={15} color="#0d9488" />
            </View>
        );
    }

    if (type === "web") {
        return (
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-orange-50">
                <Monitor size={15} color="#f97316" />
            </View>
        );
    }
    
    return (
        <View className="w-10 h-10 rounded-xl items-center justify-center bg-indigo-50">
            <Smartphone size={15} color="#6366f1" />
        </View>
    );
}

function resolveDisplayName(session: ManagerDeviceSession): string {
    if (session.device_name) return session.device_name;
    if (session.device_model) return session.device_model;
    return session.device_type === "web" ? "Web Browser" : "Unknown Device";
}

function timeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`; 
}

interface DeviceSessionCardProps {
    session: ManagerDeviceSession;
}

export function DeviceSessionCard({ session }: DeviceSessionCardProps) {
    const displayName = resolveDisplayName(session);
    return (
        <View className='flex-row items-center gap-3 w-full bg-transparent'>
            <DeviceIcon type={session.device_type} />

            <View className="flex-1 gap-1">
                <Text 
                    className='text-textPrimary text-sm font-poppins-semibold' 
                    numberOfLines={1}
                >
                    {displayName}
                </Text>

                {/* location if available */}
                {session.location_label ? (
                    <View className='flex-row items-center gap-1'>
                        <MapPin size={12} color="#8b8d98"/>
                        <Text className="text-textSecondary text-xs font-poppins">
                            {session.location_label}
                        </Text>
                    </View>
                ) : null}

                {/* last active */}
                <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#8b8d98"/>
                    <Text className='text-textSecondary text-xs font-poppins'>
                        Last active {timeAgo(session.last_active_at)}
                    </Text>
                </View>
            </View>
        </View>
    );
}