import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

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

export default function StoreManagerSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { t: translate } = useTranslation();

    const {
        user,
        profile,
        loading,
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

    if (loading && !user) {
        return (
            <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground justify-center items-center">
                <Text className="text-neutral-500 font-poppins-regular">{translate("index.loadingProfile")}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground p-2">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-2 px-4 pt-4">
                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
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

            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    {translate("settings.copyright")} 2026 Store Manager
                </Text>
            </View>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}
