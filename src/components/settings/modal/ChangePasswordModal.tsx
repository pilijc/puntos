import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, TextInput } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/supabase/supabase";
import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: Props) {
    const isDark = useColorScheme() === "dark";
    const { t: translate } = useTranslation();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setRepeatNewPassword("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleConfirm = async () => {
        if (!currentPassword || !newPassword || !repeatNewPassword) {
            Alert.alert(translate("error.title"), translate("error.missingFields"));
            return;
        }
        if (newPassword !== repeatNewPassword) {
            Alert.alert(translate("error.title"), translate("error.passwordMatch"));
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert(translate("error.title"), translate("error.passwordLimit"));
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user?.email) throw new Error("Could not find authenticated user");

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) throw new Error("Current password is incorrect");

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            Alert.alert(translate("label.confirm"), "Your password has been changed successfully.");
            handleClose();
        } catch (error: any) {
            Alert.alert(translate("error.title"), error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            onClose={handleClose}
            title={translate("settings.account.security.changePassword.title")}
            message={translate("settings.account.security.changePassword.description")}
            buttons={[
                {
                    label: translate("label.cancel"),
                    variant: "secondary",
                    onPress: handleClose,
                    disabled: loading
                },
                {
                    label: translate("label.confirm"),
                    variant: "primary",
                    onPress: handleConfirm,
                    loading: loading
                }
            ]}
        >
            <KeyboardAvoidingView
                behavior={"padding"}
                keyboardVerticalOffset={100}
            >
                <View className="gap-y-4">
                    {/* Current Password */}
                    <View>
                        <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">{translate("settings.account.security.changePassword.label.current")}</Text>
                        <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                            <Ionicons name="lock-closed-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                            <TextInput
                                className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                placeholder={translate("settings.account.security.changePassword.input.current")}
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                editable={!loading}
                                placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                            />
                        </View>
                    </View>

                    {/* New Password */}
                    <View>
                        <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">{translate("settings.account.security.changePassword.label.new")}</Text>
                        <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                            <Ionicons name="lock-open-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                            <TextInput
                                className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                placeholder={translate("settings.account.security.changePassword.input.new")}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!loading}
                                placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                            />
                        </View>
                    </View>

                    {/* Repeat New Password */}
                    <View>
                        <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">{translate("settings.account.security.changePassword.label.repeat")}</Text>
                        <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                            <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                            <TextInput
                                className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                placeholder={translate("settings.account.security.changePassword.input.repeat")}
                                secureTextEntry
                                value={repeatNewPassword}
                                onChangeText={setRepeatNewPassword}
                                editable={!loading}
                                placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
