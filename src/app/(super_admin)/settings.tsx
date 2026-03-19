import React, { useState, useCallback } from "react";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useFocusEffect } from "expo-router";

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/modal/edit-profile-modal";
import { LogoutButton } from "@/components/settings/logout-button";
import { UserProfileCard } from "@/components/settings/card/user-profile-card";
import { SecurityCard } from "@/components/settings/card/security-card";
import { LanguageCard } from "@/components/settings/card/language-card";
import { AppearanceCard } from "@/components/settings/card/appearance-card";
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
        <SafeAreaView className="flex-1 bg-muted-white dark:bg-darkBackground">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6 mt-2">
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

                <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-xl border border-neutral-200 dark:border-darkBorder">
                    <SecurityCard />
                    <LanguageCard />
                    <AppearanceCard />
                </View>

                <LogoutButton />

                {/* Footer */}
                <View className="mx-8 mt-6 items-center">
                    <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                        {translate("settings.copyright")} 2026 Admin Panel
                    </Text>
                </View>
            </ScrollView>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}
