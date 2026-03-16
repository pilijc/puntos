import React, { useState, useCallback } from "react";
import { View, Text, SafeAreaView } from "@/tw";
import { useFocusEffect } from "expo-router";

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/modal/EditProfileModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/card/UserProfileCard";
import { SecurityCard } from "@/components/settings/card/SecurityCard";
import { LanguageCard } from "@/components/settings/card/LanguageCard";
import { AppearanceCard } from "@/components/settings/card/AppearanceCard";
import { useTranslation } from "react-i18next";

export default function SuperAdminSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { t: translate } = useTranslation();

    const {
        user,
        profile,
        refreshProfile,
    } = useProfile();

    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [])
    );

    const handleProfilePress = () => {
        setEditModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground p-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                    {translate('settings.title')}
                </Text>
            </View>

            {user && (
                <UserProfileCard
                    user={user}
                    profile={profile}
                    onPress={handleProfilePress}
                />
            )}

            <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-200 dark:border-darkBorder">
                <SecurityCard />
                <LanguageCard />
                <AppearanceCard />
            </View>

            <LogoutButton />

            {/* Footer */}
            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    {translate("settings.copyright")} 2026 Front Desk
                </Text>
            </View>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}
