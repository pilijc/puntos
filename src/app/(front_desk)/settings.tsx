import React, { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity } from "@/tw";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";

import { useProfile } from "@/hooks/user/use-profile";
import { checkPasswordSetupRequired } from "@/services/frontdesk/password-service";
import { Modal, type ModalButton } from "@/components/modal";
import { SharedSettingsLayout } from "@/components/settings/shared-settings-layout";

export default function SuperAdminSettings() {
    const { t: translate } = useTranslation();
    const [passwordSetupModal, setPasswordSetupModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);
    const [isPasswordSetupComplete, setIsPasswordSetupComplete] = useState<boolean | null>(null);
    const router = useRouter();
    const { refreshProfile } = useProfile();

    useFocusEffect(
        useCallback(() => {
            const checkPasswordSetup = async () => {
                refreshProfile();

                try {
                    // Clear AsyncStorage
                    const keys = await AsyncStorage.getAllKeys();
                    const profileKeys = keys.filter(key =>
                        key.includes('profile') ||
                        key.includes('user') ||
                        key.includes('staff') ||
                        key.includes('password')
                    );
                    await AsyncStorage.multiRemove(profileKeys);

                    await new Promise(resolve => setTimeout(resolve, 100));
                    await refreshProfile();

                    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                    if (refreshedUser) {
                        const requiresPasswordSetup = await checkPasswordSetupRequired(refreshedUser.id);
                        setIsPasswordSetupComplete(!requiresPasswordSetup);
                    }
                } catch (cacheError) { }

                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const requiresPasswordSetup = await checkPasswordSetupRequired(user.id);
                        setIsPasswordSetupComplete(!requiresPasswordSetup);

                        if (requiresPasswordSetup) {
                            setPasswordSetupModal({
                                title: translate("frontdesk.transaction.passwordSetup.title"),
                                message: translate("frontdesk.transaction.passwordSetup.message"),
                                buttons: [{
                                    label: translate("frontdesk.transaction.passwordSetup.button"),
                                    variant: "primary",
                                    onPress: () => {
                                        setPasswordSetupModal(null);
                                        router.replace("/(front_desk)/setup-password");
                                        setIsPasswordSetupComplete(null);
                                    }
                                }, {
                                    label: translate("label.continue"),
                                    variant: "secondary",
                                    onPress: () => setPasswordSetupModal(null)
                                }]
                            });
                        }
                    }
                } catch (error) {
                    setIsPasswordSetupComplete(false);
                }
            };

            checkPasswordSetup();
        }, [refreshProfile, router, translate])
    );

    const banner = isPasswordSetupComplete === false ? (
        <View className="mx-4 mt-2 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl">
            <View className="flex-row items-start">
                <Text className="text-yellow-800 dark:text-yellow-200 text-lg mr-2">⚠️</Text>
                <View className="flex-1">
                    <Text className="text-yellow-800 dark:text-yellow-200 font-poppins-semibold mb-1">
                        {translate("frontdesk.transaction.passwordSetup.title")}
                    </Text>
                    <Text className="text-yellow-700 dark:text-yellow-300 text-sm font-poppins-regular">
                        {translate("frontdesk.transaction.passwordSetup.detail")}
                    </Text>
                    <TouchableOpacity
                        className="mt-3 bg-yellow-600 dark:bg-yellow-700 px-4 py-2 rounded-lg self-start"
                        onPress={() => router.replace("/(front_desk)/setup-password")}
                    >
                        <Text className="text-white font-poppins-medium text-sm">
                            {translate("frontdesk.transaction.passwordSetup.complete")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    ) : null;

    return (
        <>
            <SharedSettingsLayout
                copyrightRole="Front Desk"
                securityDisabled={isPasswordSetupComplete === false}
                securityWarning={isPasswordSetupComplete === false}
                banner={banner}
            />

            <Modal
                visible={!!passwordSetupModal}
                onClose={() => setPasswordSetupModal(null)}
                title={passwordSetupModal?.title ?? ""}
                message={passwordSetupModal?.message}
                buttons={passwordSetupModal?.buttons}
            />
        </>
    );
}