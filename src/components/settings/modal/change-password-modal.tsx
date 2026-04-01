import React, { useState } from "react";
import { KeyboardAvoidingView, useColorScheme } from "react-native";
import { View } from "@/tw";
import { supabase } from "@/supabase/supabase";
import { Modal, type ModalButton } from "@/components/modal";
import { TextField } from "@/components/text-field";
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
    const [feedbackModal, setFeedbackModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);

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
        if (newPassword !== repeatNewPassword) {
            errorAlert(translate("settings.account.security.changePassword.error.passwordMatch"))
            return;
        }
        if (newPassword.length < 8) {
            errorAlert(translate("settings.account.security.changePassword.error.passwordLimit"))
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
                        <TextField
                            label={translate("settings.account.security.changePassword.label.current")}
                            placeholder={translate("settings.account.security.changePassword.input.current")}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={true}
                        />
                        {/* New Password */}
                        <TextField
                            label={translate("settings.account.security.changePassword.label.new")}
                            placeholder={translate("settings.account.security.changePassword.input.new")}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={true}
                        />

                        {/* Repeat New Password */}
                        <TextField
                            label={translate("settings.account.security.changePassword.label.repeat")}
                            placeholder={translate("settings.account.security.changePassword.input.repeat")}
                            value={repeatNewPassword}
                            onChangeText={setRepeatNewPassword}
                            secureTextEntry={true}
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
