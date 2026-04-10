import React, { useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

// State/Auth
import { supabase } from '@/supabase/supabase';
import { softDeleteUserAccountService } from "@/services/user/settings-service";

// Components
import { Modal } from "@/components/modal";
import ChangePasswordModal from "@/components/settings/modal/change-password-modal";
import { useTranslation } from "react-i18next";


interface SecurityCardProps {
    disabled?: boolean;
    warning?: boolean;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({ disabled = false, warning = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { t: translate } = useTranslation();

    const toggleOpen = () => {
        if (disabled) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(prev => !prev);
    };

    const handleChangePassword = () => {
        if (disabled) return;
        setChangePasswordVisible(true);
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
            <View className={`bg-background dark:bg-darkBackgroundMuted p-4 overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
                <TouchableOpacity
                    onPress={toggleOpen}
                    className="flex-row items-center"
                    activeOpacity={disabled ? 1 : 0.7}
                >
                    <View className={`h-8 w-8 rounded-lg items-center justify-center ${warning ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <Ionicons
                            name={warning ? "warning-outline" : "shield-checkmark-outline"}
                            size={15}
                            color={warning ? "#d97706" : "#3b82f6"}
                        />
                    </View>

                    <View className="flex-1 ml-3">
                        <Text className={`text-base font-poppins-semibold ${disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-textPrimary dark:text-darkTextPrimary'}`}>
                            {translate('settings.account.security.title')}
                        </Text>
                        {disabled && (
                            <Text className="text-xs text-yellow-600 dark:text-yellow-400 font-poppins-regular mt-1">
                                Complete password setup to access
                            </Text>
                        )}
                    </View>

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

                        {/* change password*/}
                        <TouchableOpacity
                            onPress={handleChangePassword}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-textSecondary dark:text-darkTextSecondary">
                                {translate('settings.account.security.changePassword.title')}
                            </Text>
                            <ChevronRight size={12} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* divider */}
                        <View className="h-[1px] bg-border dark:bg-darkBorder opacity-25 ml-12" />

                        {/* delete */}
                        <TouchableOpacity
                            onPress={() => setDeleteModalVisible(true)}
                            className="flex-row items-center py-3 ml-12"
                            activeOpacity={0.6}
                        >
                            <Text className="flex-1 text-sm font-poppins-medium text-danger">
                                {translate('settings.account.security.deleteAccount.title')}
                            </Text>
                            <ChevronRight size={12} color="#94a3b8" />
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