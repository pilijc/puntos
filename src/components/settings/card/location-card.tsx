import React from 'react';
import { Alert, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/use-profile";
import { useLocation } from "@/hooks/use-location";

export const LocationCard = () => {
    const { t: translate } = useTranslation();
    const { preferences, updatePreferences } = useProfile();
    const {
        permissionStatus,
        loading: locationLoading,
        requestPermission: requestLocationPermission,
    } = useLocation();

    if (!preferences) return null;

    const togglePreference = async (key: string) => {
        const newValue = !(preferences as any)[key];
        await updatePreferences({ [key]: newValue });
    };

    const handlePress = async () => {
        if (preferences.location_enabled) {
            Alert.alert(
                translate('settings.notificationsPrivacy.location.disableTitle'),
                translate("settings.notificationsPrivacy.permissions", { services: translate("settings.notificationsPrivacy.services.location") }),
                [
                    { text: translate("label.cancel"), style: "cancel" },
                    {
                        text: translate('settings.notificationsPrivacy.openSettings'),
                        onPress: () => {
                            togglePreference('location_enabled');
                            Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            if (!permissionStatus.granted) {
                await requestLocationPermission();
            }
            togglePreference('location_enabled');
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted border-t border-neutral-200 dark:border-darkBorder items-center will-change-pressable"
        >
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Ionicons name="location-outline" size={18} color="#d8d336" />
            </View>
            <View className="ml-3 flex-1">
                <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                    {translate('settings.notificationsPrivacy.location.title')}
                </Text>
                <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
                    {locationLoading
                        ? translate('settings.checking')
                        : permissionStatus.granted
                            ? translate('settings.notificationsPrivacy.location.allow')
                            : translate('settings.notificationsPrivacy.location.denied')}
                </Text>
            </View>
            <View className="flex-row items-center">
                <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
            </View>
        </TouchableOpacity>
    );
};
