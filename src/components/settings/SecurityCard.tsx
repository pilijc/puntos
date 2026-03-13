import React, { useState } from 'react';
import { LayoutAnimation, UIManager, Platform } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

// State/Auth
import { supabase } from '@/supabase/supabase';
import { softDeleteUserAccountService } from "@/services/settings-service";

// Components
import { Modal } from "@/components/modal";
import ChangePasswordModal from "@/components/settings/ChangePasswordModal";
import { useTranslation } from "react-i18next";


export const SecurityCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { t: translate } = useTranslation();

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(prev => !prev);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw new Error('Could not find user.');
            await softDeleteUserAccountService(user.id);
            await supabase.auth.signOut();
            setDeleteModalVisible(false);
            router.replace('/(onboarding)/welcome');
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <View className="bg-background dark:bg-darkBackgroundMuted p-4 border-t border-neutral-200 dark:border-darkBorder overflow-hidden">
                <TouchableOpacity
                    onPress={toggleOpen}
                    className="flex-row items-center"
                    activeOpacity={0.7}
                >
                    <View className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center">
                        <Ionicons name="shield-checkmark-outline" size={15} color="#3b82f6" />
                    </View>

                    <Text className="flex-1 ml-3 text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                        {translate('settings.account.security.title')}
                    </Text>

                    <Ionicons
                        name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                        size={20}
                        color="#94a3b8"
                    />
                </TouchableOpacity>

                {isOpen && (
                    <View className="mt-2">
                        {/* Divider */}
                        <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder mb-1 ml-12" />

                        {/* Change Password Row */}
                        <TouchableOpacity
                            onPress={() => setChangePasswordVisible(true)}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-neutral-600 dark:text-darkTextSecondary">
                                {translate('settings.account.security.changePassword.title')}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder ml-12" />

                        {/* Delete Account Row */}
                        <TouchableOpacity
                            onPress={() => setDeleteModalVisible(true)}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-danger">
                                {translate('settings.account.security.deleteAccount.title')}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ChangePasswordModal
                visible={changePasswordVisible}
                onClose={() => setChangePasswordVisible(false)}
            />

            <Modal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                title={translate("settings.account.security.deleteAccount.title")}
                message={translate("settings.account.security.deleteAccount.description")}
                buttons={[
                    {
                        label: translate("label.cancel"),
                        variant: "secondary",
                        onPress: () => setDeleteModalVisible(false)
                    },
                    {
                        label: translate("label.delete"),
                        variant: "danger",
                        onPress: handleDeleteAccount,
                        loading: isDeleting
                    }
                ]}
            />
        </>
    );
};