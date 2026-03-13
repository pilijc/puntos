import React from 'react';
import { Alert, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications } from "@/hooks/use-notifications";

export const NotificationCard = () => {
    const { t: translate } = useTranslation();
    const { preferences, updatePreferences } = useProfile();
    const {
        hasPermission,
        loading: notificationLoading,
        requestPermission: requestNotificationPermission,
    } = useNotifications();

    if (!preferences) return null;

    const togglePreference = async (key: string) => {
        const newValue = !(preferences as any)[key];
        await updatePreferences({ [key]: newValue });
    };

    const handlePress = async () => {
        if (preferences.near_store_notifications) {
            Alert.alert(
                "Disable Nearby Alerts",
                "To completely revoke notification permissions, you must disable the setting in your device's settings menu. Would you like to open it now?",
                [
                    { text: translate("label.cancel"), style: "cancel" },
                    {
                        text: "Open Settings",
                        onPress: () => {
                            togglePreference('near_store_notifications');
                            Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            if (!hasPermission) {
                await requestNotificationPermission();
            }
            togglePreference('near_store_notifications');
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted items-center will-change-pressable"
        >
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <Ionicons name="notifications-outline" size={18} color="#FF6600" />
            </View>
            <View className="ml-3 flex-1">
                <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                    {translate('settings.notificationsPrivacy.alerts.title')}
                </Text>
                <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
                    {notificationLoading
                        ? translate('settings.checking')
                        : hasPermission
                            ? translate('settings.notificationsPrivacy.location.allow') // Reuse location's allowed/denied strings or add new global strings
                            : translate('settings.notificationsPrivacy.location.denied')}
                </Text>
            </View>
            <View className="flex-row items-center">
                <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
            </View>
        </TouchableOpacity>
    );
};
