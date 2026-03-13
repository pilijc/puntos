import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/modal/EditProfileModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/card/UserProfileCard";
import { SecurityCard } from "@/components/settings/card/SecurityCard";
import DarkModeToggle from "@/components/ui/dark-mode-toggle";

export default function StoreManagerSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);

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
                <Text className="text-neutral-500 font-poppins-regular">Loading profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground p-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
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

            <View>
                <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
                    ACCOUNT SETTINGS
                </Text>
            </View>

            <SecurityCard />

            <LogoutButton />

            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    Copyright 2026 Store Manager
                </Text>
            </View>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}
