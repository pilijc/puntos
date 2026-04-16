import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Modal } from '@/components/modal';
import { AlertTriangle } from 'lucide-react-native';
import { ManagerDeviceSession } from '@/type/store-manager/device-session';
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
        await onCheckAgain();
        setIsRetrying(false);
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
            {/* warning banner */}
            <View className="flex-row items-start gap-2.5 bg-amber-500/10 border border-border rounded-xl mb-4 p-3.5">      
                <AlertTriangle size={20} color="#f59e0b" />
                <Text className="flex-1 text-textMuted text-sm leading-5 relative top-[-1px]">
                    You have reached the maximum of {" "}
                    <Text className='font-poppins-bold text-Secondary'>2 Active sessions
                    </Text>
                    you must log out of one of the devices below before you can access your dashboard from this device.
                </Text>
            </View>

            {/* device list */}
            <Text className="text-textMuted text-xs font-semibold tracking-wide uppercase mb-2">
                Currently active devices
            </Text>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 240 }}
            >
                {sessions.map((session) => (
                    <DeviceSessionCard key={session.id} session={session} />
                ))}
            </ScrollView>
        </Modal>
    );
}