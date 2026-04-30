import React, { useState } from 'react';
import { Linking } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, Bell } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/user/use-profile";
import { useNotifications } from "@/hooks/use-notifications";
import { Modal, type ModalButton } from '@/components/modal';

export const NotificationCard = () => {
    const { t: translate } = useTranslation();
    const { preferences, updatePreferences } = useProfile();
    const {
        hasPermission,
        loading: notificationLoading,
        requestPermission: requestNotificationPermission,
    } = useNotifications();

    const [modal, setModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);

    if (!preferences) return null;

    const statusText = notificationLoading
        ? translate('settings.checking')
        : !hasPermission
            ? translate('settings.notificationsPrivacy.alerts.denied')
            : preferences.near_store_notifications
                ? translate('settings.notificationsPrivacy.alerts.allow')
                : translate('settings.notificationsPrivacy.alerts.disabled');

    const togglePreference = async (key: string) => {
        const newValue = !(preferences as any)[key];
        await updatePreferences({ [key]: newValue });
    };

    const handlePress = async () => {
        if (preferences.near_store_notifications) {
            setModal({
                title: translate('settings.notificationsPrivacy.alerts.title'),
                message: translate("settings.notificationsPrivacy.permissions", {
                    services: translate("settings.notificationsPrivacy.services.notifications")
                }),
                buttons: [
                    {
                        label: translate("label.cancel"),
                        variant: "secondary",
                        onPress: () => setModal(null),
                    },
                    {
                        label: translate('label.settings'),
                        onPress: () => {
                            setModal(null);
                            togglePreference('near_store_notifications');
                            Linking.openSettings();
                        },
                    },
                ],
            });
        } else {
            if (!hasPermission) {
                const nextStatus = await requestNotificationPermission();
                if (!nextStatus.granted) return;
            }
            togglePreference('near_store_notifications');
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
                className="flex-row p-3 bg-background dark:bg-darkBackgroundMuted items-center will-change-pressable"
            >
                <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
                    <Bell size={18} color="#FF6600" />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.notificationsPrivacy.alerts.title')}
                    </Text>
                    <Text className="text-xs font-poppins-regular text-textMuted dark:text-darkTextMuted">
                        {statusText}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <ChevronRight size={15} color="#94a3b8" />
                </View>
            </TouchableOpacity>

            <Modal
                visible={!!modal}
                onClose={() => setModal(null)}
                title={modal?.title ?? ""}
                message={modal?.message}
                buttons={modal?.buttons}
            />
        </>
    );
};
