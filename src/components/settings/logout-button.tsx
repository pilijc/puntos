import React from 'react';
import { Alert } from 'react-native';
import { Text, TouchableOpacity, View } from "@/tw";
import { useAuthActions } from '@/hooks/use-auth-actions';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

interface LogoutButtonProps {
    showIcon?: boolean;
}

export const LogoutButton = ({ showIcon = true }: LogoutButtonProps) => {
    const { handleLogout } = useAuthActions();
    const { t: translate } = useTranslation();

    const confirmLogout = () => {
        Alert.alert(
            translate("settings.logout.confirmTitle"),
            translate("settings.logout.confirmMessage"),
            [
                { text: translate("label.cancel"), style: "cancel" },
                { text: translate("settings.logout.title"), style: "destructive", onPress: handleLogout },
            ]);
    };

    return (
        <TouchableOpacity
            onPress={confirmLogout}
            activeOpacity={0.7}
            className="mx-4 bg-primary py-4 rounded-xl items-center flex-row will-change-pressable justify-center border border-neutral-100 dark:border-darkBorder"
        >
            {showIcon && (
                <View className="h-5 w-5 items-center mr-2">
                    <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
                </View>
            )}
            <Text className="text-white text-base font-poppins-semibold">
                {translate("settings.logout.title")}
            </Text>
        </TouchableOpacity>
    );
};
