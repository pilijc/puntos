import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { View, Text } from '@/tw';
import { Modal } from '@/components/modal';
import { AlertCircle } from 'lucide-react-native';
import { ManagerDeviceSession, MAX_DEVICE_SESSIONS } from '@/type/store-manager/device-session';
import { DeviceSessionCard } from './device-session-card';
import { useTranslation } from 'react-i18next';

interface DeviceLimitModalProps {
    visible: boolean;
    sessions: ManagerDeviceSession[];
    maxSessions?: number;
    onCheckAgain: () => Promise<void>;
    onCancel: () => void;
}

export function DeviceLimitModal({
    visible,
    sessions,
    maxSessions = MAX_DEVICE_SESSIONS,
    onCheckAgain,
    onCancel,
}: DeviceLimitModalProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const { t: translate } = useTranslation();

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await onCheckAgain();
        } catch (error) {
            console.error("Failed to recheck device session limit:", error);
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Modal 
            visible={visible}
            onClose={onCancel}
            title={translate("settings.deviceSessions.limitReached")}
            buttons={[
                {
                    label: translate("settings.deviceSessions.checkAgain"),
                    onPress: handleRetry,
                    variant: "primary",
                    loading: isRetrying,
                    disabled: isRetrying,
                }
            ]}
            dismissOnBackdrop={false}
            showCloseButton={true}
        >
            <View className="w-full">
                {/* warning banner */}
                <View className="flex-row items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl mb-6 p-4">      
                    <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center">
                        <AlertCircle size={14} color="#ef4444" className="dark:text-red-400" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-red-900 dark:text-red-200 text-sm font-poppins-semibold mb-0.5">
                            {translate("settings.deviceSessions.limitWarningTitle")}
                        </Text>
                        <Text className="text-red-700/80 dark:text-red-300 text-xs font-poppins leading-4">
                            {translate("settings.deviceSessions.limitWarningBody", { max: maxSessions })}
                        </Text>
                    </View>
                </View>

                {/* device list */}
                <View className="mb-2">
                    <Text className="text-textSecondary dark:text-darkTextSecondary text-[10px] font-poppins-semibold tracking-wider uppercase mb-3">
                        {translate("settings.deviceSessions.yourActiveDevices")}
                    </Text>

                    <View className="bg-backgroundMuted/50 dark:bg-darkBorder/10 border border-border dark:border-darkBorder rounded-xl px-1 overflow-hidden">
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 240 }}
                            contentContainerStyle={{ paddingVertical: 8 }}
                        >
                            {sessions.map((session, index) => (
                                <View 
                                    key={session.id} 
                                    className={index > 0 ? "border-t border-border/50 dark:border-darkBorder/50 pt-3 mt-3 px-3" : "px-3"}
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
