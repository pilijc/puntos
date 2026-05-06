import React, { useState, useMemo } from "react";
import { KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { supabase } from "@/supabase/supabase";
import { Modal, type ModalButton } from "@/components/modal";
import { TextField } from "@/components/text-field";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "lucide-react-native";
import { usePasswordValidation } from "@/hooks/use-password-validation";

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
    const [feedbackModal, setFeedbackModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);

    const { requirements, allMet } = usePasswordValidation(newPassword);

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
        const errorAlert = (msg: string) => setFeedbackModal({
            title: translate("label.error"),
            message: msg,
            buttons: [{
                label: translate("label.ok"),
                variant: "secondary",
                onPress: () => setFeedbackModal(null)
            }]
        });

        if (!currentPassword || !newPassword || !repeatNewPassword) {
            errorAlert(translate("settings.account.security.changePassword.error.missingFields"))
            return;
        }

        if (!allMet) {
            errorAlert(translate("settings.account.security.changePassword.error.passwordLimit"))
            return;
        }

        if (newPassword !== repeatNewPassword) {
            errorAlert(translate("settings.account.security.changePassword.error.passwordMatch"))
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
            if (signInError) throw new Error(translate("settings.account.security.changePassword.error.incorrect"));

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setFeedbackModal({
                title: translate("label.confirm"),
                message: translate("settings.account.security.changePassword.success"),
                buttons: [{
                    label: translate("label.ok"),
                    onPress: () => {
                        setFeedbackModal(null);
                        handleClose();
                    }
                }]
            });
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errorAlert(errorMessage || translate("settings.account.security.changePassword.error.failed"));
        } finally {
            setLoading(false);
        }
    };

    const RequirementItem = ({ label, met }: { label: string; met: boolean }) => (
        <View className="flex-row items-center gap-x-2 mb-0.5">
            {met ? (
                <CheckCircle2 size={14} color="#10B981" />
            ) : (
                <Circle size={14} color="#9CA3AF" />
            )}
            <Text
                className={`text-[10px] font-poppins ${met
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-neutral-500 dark:text-darkTextSecondary"
                    }`}
            >
                {label}
            </Text>
        </View>
    );

    return (
        <>
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
                        loading: loading,
                        disabled: !allMet
                    }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={"padding"}
                    keyboardVerticalOffset={100}
                >
                    <View className="gap-y-4">
                        {/* Current Password */}
                        <TextField
                            label={translate("settings.account.security.changePassword.label.current")}
                            placeholder={translate("settings.account.security.changePassword.input.current")}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={true}
                            sanitize={(v) => v}
                        />
                        {/* New Password */}
                        <View>
                            <TextField
                                label={translate("settings.account.security.changePassword.label.new")}
                                placeholder={translate("settings.account.security.changePassword.input.new")}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={true}
                                sanitize={(v) => v}
                            />
                            {/* Password Requirements */}
                            <View className="mt-2 bg-neutral-50 dark:bg-darkBackgroundMuted/50 p-3 rounded-xl border border-neutral-100 dark:border-darkBorder/50">
                                <Text className="text-[11px] font-poppins-semibold text-neutral-700 dark:text-darkTextPrimary mb-1">
                                    {translate("settings.account.security.changePassword.requirements.title")}
                                </Text>
                                <RequirementItem
                                    label={translate("settings.account.security.changePassword.requirements.minLength")}
                                    met={requirements.hasMinLength}
                                />
                                <RequirementItem
                                    label={translate("settings.account.security.changePassword.requirements.uppercase")}
                                    met={requirements.hasUppercase}
                                />
                                <RequirementItem
                                    label={translate("settings.account.security.changePassword.requirements.lowercase")}
                                    met={requirements.hasLowercase}
                                />
                                <RequirementItem
                                    label={translate("settings.account.security.changePassword.requirements.number")}
                                    met={requirements.hasNumber}
                                />
                                <RequirementItem
                                    label={translate("settings.account.security.changePassword.requirements.special")}
                                    met={requirements.hasSpecial}
                                />
                            </View>
                        </View>

                        {/* Repeat New Password */}
                        <TextField
                            label={translate("settings.account.security.changePassword.label.repeat")}
                            placeholder={translate("settings.account.security.changePassword.input.repeat")}
                            value={repeatNewPassword}
                            onChangeText={setRepeatNewPassword}
                            secureTextEntry={true}
                            sanitize={(v) => v}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <Modal
                visible={!!feedbackModal}
                onClose={() => setFeedbackModal(null)}
                title={feedbackModal?.title ?? ""}
                message={feedbackModal?.message}
                buttons={feedbackModal?.buttons}
            />
        </>
    );
}
