import React, { useState } from 'react';
import { Linking } from 'react-native';
import { Text, TouchableOpacity, View } from "@/tw";
import { useAuthActions } from '@/hooks/use-auth-actions';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { Modal, type ModalButton } from "@/components/modal";

interface LogoutButtonProps {
    showIcon?: boolean;
}

export const LogoutButton = ({ showIcon = true }: LogoutButtonProps) => {
    const { handleLogout } = useAuthActions();
    const { t: translate } = useTranslation();

    const [modal, setModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);

    const handlePress = async () => {
        // Alert.alert(
        //     translate("settings.logout.confirmTitle"),
        //     translate("settings.logout.confirmMessage"),
        //     [
        //         { text: translate("label.cancel"), style: "cancel" },
        //         { text: translate("settings.logout.title"), style: "destructive", onPress: handleLogout },
        //     ]);
        setModal({
            title: translate("settings.logout.title"),
            message: translate("settings.logout.confirmMessage"),
            buttons: [
                {
                    label: translate("label.cancel"),
                    variant: "secondary",
                    onPress: () => setModal(null),
                },
                {
                    label: translate("settings.logout.title"),
                    variant: "primary",
                    onPress: () => {
                        handleLogout();
                        setModal(null);
                    }
                }
            ]
        });
    };

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
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
