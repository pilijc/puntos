import React, { useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, CircleAlert, Shield, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Modal } from "@/components/modal";
import ChangePasswordModal from "@/components/settings/modal/change-password-modal";
import { useTranslation } from "react-i18next";
import { useDeleteAccount } from "@/hooks/user/use-delete-account";


interface SecurityCardProps {
    disabled?: boolean;
    warning?: boolean;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({ disabled = false, warning = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const { deleteAccount, isDeleting } = useDeleteAccount();
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

    return (
        <>
            <View className={`bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
                <TouchableOpacity
                    onPress={toggleOpen}
                    className="flex-row items-center"
                    activeOpacity={disabled ? 1 : 0.7}
                >
                    <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">{warning 
                        ? <CircleAlert size={15} color={disabled ? "#a3a3a3" : "#FF6600"} /> 
                        : <Shield size={15} color={disabled ? "#a3a3a3" : "#FF6600"} />}
                    </View>

                    <View className="flex-1 ml-2">
                        <Text className={`text-md font-poppins-semibold ${disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-textPrimary dark:text-darkTextPrimary'}`}>
                            {translate('settings.account.security.title')}
                        </Text>
                        {disabled && (
                            <Text className="text-xs text-yellow-600 dark:text-yellow-400 font-poppins-regular mt-1">
                                Complete password setup to access
                            </Text>
                        )}
                    </View>
             
             

                    {isOpen ? (
                        <ChevronUp size={15} color="#94a3b8" />
                    ) : (
                        <ChevronDown size={15} color="#94a3b8" />
                    )}
                </TouchableOpacity>

                {isOpen && (
                    <View className="mt-2">
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
                        onPress: deleteAccount,
                        loading: isDeleting
                    }
                ]}
            />
        </>
    );
};