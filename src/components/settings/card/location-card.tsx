import React, { useState } from 'react';
import { Linking } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/user/use-profile";
import { useLocation } from "@/hooks/user/use-location";
import { Modal, type ModalButton } from "@/components/modal";
import { clearLocationService } from "@/services/user/settings-service";
import { clearLocationManuallyDisabled, markLocationManuallyDisabled } from "@/services/user/location-preference-service";

export const LocationCard = () => {
    const { t: translate } = useTranslation();
    const { preferences, updatePreferences, user } = useProfile();
    const {
        permissionStatus,
        loading: locationLoading,
        requestPermission: requestLocationPermission,
    } = useLocation();

    const [modal, setModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);

    if (!preferences) return null;

    const statusText = locationLoading
        ? translate('settings.checking')
        : !permissionStatus.granted
            ? translate('settings.notificationsPrivacy.location.denied')
            : preferences.location_enabled
                ? translate('settings.notificationsPrivacy.location.allow')
                : translate('settings.notificationsPrivacy.location.disabled');

    const togglePreference = async (key: string) => {
        const newValue = !(preferences as any)[key];
        await updatePreferences({ [key]: newValue });

        if (key === 'location_enabled' && !newValue && user?.id) {
            try {
                await markLocationManuallyDisabled(user.id);
                await clearLocationService(user.id);
            } catch (e) {
                console.error("Failed to clear location on disable:", e);
            }
        }

        if (key === 'location_enabled' && newValue && user?.id) {
            try {
                await clearLocationManuallyDisabled(user.id);
            } catch (e) {
                console.error("Failed to clear location manual-disable marker:", e);
            }
        }
    };

    const handlePress = async () => {
        if (preferences.location_enabled) {
            setModal({
                title: translate("settings.notificationsPrivacy.location.title"),
                message: translate("settings.notificationsPrivacy.permissions", {
                    services: translate("settings.notificationsPrivacy.services.location")
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
                            togglePreference('location_enabled');
                            Linking.openSettings();
                        },
                    },
                ],
            });
        } else {
            if (!permissionStatus.granted) {
                const nextStatus = await requestLocationPermission();
                if (!nextStatus.granted) return;
            }
            togglePreference('location_enabled');
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
                className="flex-row p-3 bg-white dark:bg-darkBackground items-center will-change-pressable"
            >
                <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
                    <MapPin size={18} color="#ff6600" />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.notificationsPrivacy.location.title')}
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
