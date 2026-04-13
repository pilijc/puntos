import React, { useState, useCallback } from "react";
import { View, Text } from "@/tw";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/user/use-profile";
import StoreScreenContainer from "@/components/ui/store-screen-container";

// components
import EditProfileModal from "@/components/settings/modal/edit-profile-modal";
import { LogoutButton } from "@/components/settings/logout-button";
import { UserProfileCard } from "@/components/settings/card/user-profile-card";
import { SecurityCard } from "@/components/settings/card/security-card";
import { LanguageCard } from "@/components/settings/card/language-card";
import { AppearanceCard } from "@/components/settings/card/appearance-card";

interface SharedSettingsLayoutProps {
    headerRight?: React.ReactNode;
    extraCards?: React.ReactNode;
    copyrightRole: string;
    securityDisabled?: boolean;
    securityWarning?: boolean;
    banner?: React.ReactNode;
}

export const SharedSettingsLayout = ({
    headerRight,
    extraCards,
    copyrightRole,
    securityDisabled = false,
    securityWarning = false,
    banner
}: SharedSettingsLayoutProps) => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { t: translate } = useTranslation();
    const { user, profile, loading, refreshProfile } = useProfile();

    useFocusEffect(useCallback(() => { refreshProfile(); }, []));

    if (loading && !user) {
        return (
            <StoreScreenContainer backgroundClassName="bg-backgroundMuted dark:bg-darkBackground">
                <Text className="text-textMuted font-poppins-regular mt-20 self-center">
                    {translate("user.discover.loadingProfile")}
                </Text>
            </StoreScreenContainer>
        );
    }

    return (
        <>
            <StoreScreenContainer backgroundClassName="bg-backgroundMuted dark:bg-darkBackground" contentGap={16}>
                {/* header */}
                <View className="flex-row justify-between items-center w-full ml-1 mt-7.5">
                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.title')}
                    </Text>
                    {headerRight ? headerRight : <View className="w-10 h-10 opacity-0" />}
                </View>

                {/* profile */}
                {user && (
                    <View>
                        <UserProfileCard user={user} profile={profile} onPress={() => setEditModalVisible(true)} />
                    </View>
                )}

                {banner}

                {/* account section */}
                <View className="overflow-hidden bg-background dark:bg-darkBackgroundCard rounded-xl border border-border dark:border-darkBorder">
                    <SecurityCard
                        disabled={securityDisabled}
                        warning={securityWarning}
                    />
                    <View className="h-[1px] bg-border dark:bg-darkBorder" />
                    <LanguageCard />
                    <View className="h-[1px] bg-border dark:bg-darkBorder" />
                    <AppearanceCard />
                </View>

                {extraCards}

                <LogoutButton />

                {/* footer */}
                <View className="items-center pb-2">
                    <Text className="text-[10px] tracking-[2px] text-textMuted font-poppins-medium">
                        {translate("settings.copyright")} 2026 {copyrightRole}
                    </Text>
                </View>
            </StoreScreenContainer>

            <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} />
        </>
    );
};