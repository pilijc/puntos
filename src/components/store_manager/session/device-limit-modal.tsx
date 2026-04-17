import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { View, Text } from '@/tw';
import { Modal } from '@/components/modal';
import { AlertCircle } from 'lucide-react-native';
import { ManagerDeviceSession, MAX_DEVICE_SESSIONS } from '@/type/store-manager/device-session';
import { DeviceSessionCard } from './device-session-card';

interface DeviceLimitModalProps {
    visible: boolean;
    sessions: ManagerDeviceSession[];
    onCheckAgain: () => Promise<void>;
    onCancel: () => void;
}

export function DeviceLimitModal({
    visible,
    sessions,
    onCheckAgain,
    onCancel,
}: DeviceLimitModalProps) {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await onCheckAgain();
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Modal 
            visible={visible}
            onClose={onCancel}
            title="Device Limit Reached"
            buttons={[
                {
                    label: "Check Again",
                    onPress: handleRetry,
                    variant: "primary",
                    loading: isRetrying,
                }
            ]}
            dismissOnBackdrop={false}
            showCloseButton={true}
        >
            <View className="w-full">
                {/* warning banner */}
                <View className="flex-row items-center gap-3 bg-red-50 border border-red-100 rounded-xl mb-6 p-4">      
                    <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                        <AlertCircle size={14} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-red-900 text-sm font-poppins-semibold mb-0.5">
                            Active Session Limit
                        </Text>
                        <Text className="text-red-700/80 text-xs font-poppins leading-4">
                            You can have up to {MAX_DEVICE_SESSIONS} active sessions. Please log out of another device to continue.
                        </Text>
                    </View>
                </View>

                {/* device list */}
                <View className="mb-2">
                    <Text className="text-textSecondary text-[10px] font-poppins-semibold tracking-wider uppercase mb-3">
                        Your Active Devices
                    </Text>

                    <View className="bg-backgroundMuted/50 border border-border rounded-xl px-1 overflow-hidden">
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 240 }}
                            contentContainerStyle={{ paddingVertical: 8 }}
                        >
                            {sessions.map((session, index) => (
                                <View 
                                    key={session.id} 
                                    className={index > 0 ? "border-t border-border/50 pt-3 mt-3 px-3" : "px-3"}
                                >
                                    <DeviceSessionCard session={session} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
}