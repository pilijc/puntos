import React, { useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { View, Text, TouchableOpacity } from "@/tw";
import { Shield, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react-native';
import { router } from "expo-router";

// State/Auth
import { supabase } from '@/supabase/supabase';
import { softDeleteUserAccountService } from "@/services/settings-service";

// Components
import { Modal } from "@/components/modal";
import ChangePasswordModal from "@/components/settings/modal/change-password-modal";
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
            <View className="bg-background dark:bg-darkBackgroundMuted p-4 border-t border-border dark:border-darkBorder overflow-hidden">
                <TouchableOpacity
                    onPress={toggleOpen}
                    className="flex-row items-center"
                    activeOpacity={0.7}
                >
                    <View className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center">
                        <Shield size={15} color="#3b82f6" />
                    </View>

                    <Text className="flex-1 ml-3 text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.account.security.title')}
                    </Text>

                    {isOpen ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                </TouchableOpacity>

                {isOpen && (
                    <View className="mt-2">
                        {/* divider */}
                        <View className="h-[1px] bg-border dark:bg-darkBorder mb-1 ml-12" />

                        {/* change password*/}
                        <TouchableOpacity
                            onPress={() => setChangePasswordVisible(true)}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-textSecondary dark:text-darkTextSecondary">
                                {translate('settings.account.security.changePassword.title')}
                            </Text>
                            <ChevronRight size={14} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* divider */}
                        <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder ml-12" />

                        {/* delete */}
                        <TouchableOpacity
                            onPress={() => setDeleteModalVisible(true)}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-danger">
                                {translate('settings.account.security.deleteAccount.title')}
                            </Text>
                            <ChevronRight size={14} color="#94a3b8" />
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