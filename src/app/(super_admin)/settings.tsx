import React, { useState, useCallback } from "react";
import { View, Text, SafeAreaView } from "@/tw";
import { useFocusEffect } from "expo-router";

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/EditProfileModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import { SecurityCard } from "@/components/settings/SecurityCard";
import DarkModeToggle from "@/components/ui/dark-mode-toggle";

export default function SuperAdminSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);

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
                    Settings
                </Text>
                <DarkModeToggle />
            </View>

            {user && (
                <UserProfileCard
                    user={user}
                    profile={profile}
                    onPress={handleProfilePress}
                />
            )}

            {/* Account Settings Section */}
            <View>
                <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
                    ACCOUNT SETTINGS
                </Text>
            </View>

            <SecurityCard />

            <LogoutButton />

            {/* Footer */}
            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    Copyright 2026 Admin Panel
                </Text>
            </View>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}
