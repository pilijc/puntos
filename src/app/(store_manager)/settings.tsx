import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useProfile } from "@/hooks/use-profile";

// Components
import EditProfileModal from "@/components/settings/EditProfileModal";
import SecurityModal from "@/components/settings/SecurityModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import DarkModeToggle from "@/components/ui/dark-mode-toggle";

export default function StoreManagerSettings() {
    const [modalVisible, setModalVisible] = useState(false);
    const [securityModalVisible, setSecurityModalVisible] = useState(false);

    const {
        user,
        profile,
        loading,
        updateProfile,
        refreshProfile,
    } = useProfile();

    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [])
    );

    const handleProfilePress = () => {
        setModalVisible(true);
    };

    const handleSaveProfile = async (newName: string, _newEmail: string, newAvatarUrl?: string | null) => {
        const result = await updateProfile({ name: newName, avatar_url: newAvatarUrl });
        if (result.success) {
            Alert.alert("Success", "Profile updated successfully");
        } else {
            throw new Error("Failed to update profile");
        }
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

            <View>
                <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
                    ACCOUNT SETTINGS
                </Text>
            </View>

            <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-200 dark:border-darkBorder">
                <TouchableOpacity
                    onPress={() => setSecurityModalVisible(true)}
                    className="flex-row items-center p-4 bg-background dark:bg-darkBackgroundMuted active:bg-neutral-50 dark:active:bg-darkBackgroundCard will-change-pressable">
                    <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
                        <Ionicons name="settings-outline" size={15} color="#3b82f6" />
                    </View>
                    <Text className="text-base flex-1 ml-3 font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        Security
                    </Text>
                    <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
                </TouchableOpacity>
            </View>

            <LogoutButton />

            <View className="mx-8 mt-6 items-center">
                <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
                    Copyright 2026
                </Text>
            </View>

            <EditProfileModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialUsername={profile?.name || user?.email?.split("@")[0] || ""}
                initialEmail={user?.email || ""}
                initialAvatar={profile?.avatar_url}
                userId={user?.id}
                onSave={handleSaveProfile}
            />

            <SecurityModal
                visible={securityModalVisible}
                onClose={() => setSecurityModalVisible(false)}
            />
        </SafeAreaView>
    );
}
