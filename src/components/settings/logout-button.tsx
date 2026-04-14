import React, { useState } from 'react';
import { useAuthActions } from '@/hooks/use-auth-actions';
import { useTranslation } from "react-i18next";
import { Modal, type ModalButton } from "@/components/modal";
import { Button } from "@/components/button";

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
            <Button
                label={translate("settings.logout.title")}
                onPress={handlePress}
                variant="primary"
                fullWidth
                authButton
                dense
                icon={showIcon ? "LogOut" : undefined}
            />

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
