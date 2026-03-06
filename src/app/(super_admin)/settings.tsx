import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useFocusEffect } from "expo-router";

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/EditProfileModal";
import SecurityModal from "@/components/settings/SecurityModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import DarkModeToggle from "@/components/ui/dark-mode-toggle";

/**
 * Super Admin Settings Screen
 * Standardized for consistent account management across all roles.
 */
export default function SuperAdminSettings() {
    // Component State
    const [modalVisible, setModalVisible] = useState(false);
    const [securityModalVisible, setSecurityModalVisible] = useState(false);

    // Profile Hook
    const {
        user,
        profile,
        loading,
        updateProfile,
        refreshProfile,
    } = useProfile();

    // Refresh profile on screen focus
    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [])
    );

    // --- EDIT PROFILE LOGIC ---

    /**
     * Triggers the edit profile modal
     */
    const handleProfilePress = () => {
        setModalVisible(true);
    };

    /**
     * Handles saving profile updates from the modal
     */
    const handleSaveProfile = async (newName: string, _newEmail: string) => {
        const result = await updateProfile(newName);
        if (result.success) {
            Alert.alert("Success", "Profile updated successfully");
        } else {
            throw new Error("Failed to update profile");
        }
    };
    // -------------------------

    // Loading State
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
                <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                    Settings
                </Text>
                <DarkModeToggle />
            </View>

            {/* User Info Card - Triggers Edit Modal */}
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

            {/* In a super admin screen, we can keep it as basic or extended as needed, 
                but keeping the logout button and profile card is essential for a unified UI. */}
            <LogoutButton />

            {/* Footer */}
            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    Copyright 2026 Admin Panel
                </Text>
            </View>

            {/* Modals */}
            <EditProfileModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialUsername={profile?.name || user?.email?.split("@")[0] || ""}
                initialEmail={user?.email || ""}
                onSave={handleSaveProfile}
            />

            <SecurityModal
                visible={securityModalVisible}
                onClose={() => setSecurityModalVisible(false)}
            />
        </SafeAreaView>
    );
}
