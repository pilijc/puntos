import React, { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

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
import { checkPasswordSetupRequired } from "@/services/frontdesk/password-service";
import { Modal, type ModalButton } from "@/components/modal";

export default function SuperAdminSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordSetupModal, setPasswordSetupModal] = useState<{
        title: string;
        message: string;
        buttons: ModalButton[];
    } | null>(null);
    const [isPasswordSetupComplete, setIsPasswordSetupComplete] = useState<boolean | null>(null);
    const { t: translate } = useTranslation();
    const router = useRouter();

    const {
        user,
        profile,
        refreshProfile,
    } = useProfile();

    useFocusEffect(
        useCallback(() => {
            const checkPasswordSetup = async () => {
                refreshProfile();
                
                // Clear React Native cache before checking password setup
                try {
                  // Clear AsyncStorage (React Native equivalent of localStorage)
                  const keys = await AsyncStorage.getAllKeys();
                  const profileKeys = keys.filter(key => 
                    key.includes('profile') || 
                    key.includes('user') || 
                    key.includes('staff') ||
                    key.includes('password')
                  );
                  await AsyncStorage.multiRemove(profileKeys);
                  
                  // Force refresh profile data
                  await new Promise(resolve => setTimeout(resolve, 100));
                  await refreshProfile();
                  
                  // Re-check password setup status after cache clear
                  const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                  if (refreshedUser) {
                    const requiresPasswordSetup = await checkPasswordSetupRequired(refreshedUser.id);
                    const isComplete = !requiresPasswordSetup;
                    setIsPasswordSetupComplete(isComplete);
                  }
                } catch (cacheError) {
                }
                
                // Check if password setup is required
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const requiresPasswordSetup = await checkPasswordSetupRequired(user.id);
                        const isComplete = !requiresPasswordSetup;
                        setIsPasswordSetupComplete(isComplete);
                        
                        if (requiresPasswordSetup) {
                            setPasswordSetupModal({
                                title: "Password Setup Required",
                                message: "You must set up your password before accessing security features.",
                                buttons: [{
                                    label: "Set Password",
                                    variant: "primary",
                                    onPress: () => {
                                        setPasswordSetupModal(null);
                                        router.replace("/(front_desk)/setup-password");
                                        // Mark that user went to setup, so we refresh when they return
                                        setIsPasswordSetupComplete(null);
                                    }
                                }, {
                                    label: "Continue",
                                    variant: "secondary",
                                    onPress: () => {
                                        setPasswordSetupModal(null);
                                    }
                                }]
                            });
                            return;
                        }
                    }
                } catch (error) {
                    setIsPasswordSetupComplete(false);
                }
            };
            
            checkPasswordSetup();
        }, [refreshProfile, router])
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
                    <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                        {translate('settings.title')}
                    </Text>
                </View>

                {/* Password Setup Warning Banner */}
                {isPasswordSetupComplete === false && (
                    <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 mb-6 rounded-xl">
                        <View className="flex-row items-start">
                            <Text className="text-yellow-800 dark:text-yellow-200 text-lg mr-2">⚠️</Text>
                            <View className="flex-1">
                                <Text className="text-yellow-800 dark:text-yellow-200 font-poppins-semibold mb-1">
                                    Password Setup Required
                                </Text>
                                <Text className="text-yellow-700 dark:text-yellow-300 text-sm font-poppins-regular">
                                    Complete password setup to access all security features and ensure proper account protection.
                                </Text>
                                <TouchableOpacity
                                    className="mt-3 bg-yellow-600 dark:bg-yellow-700 px-4 py-2 rounded-lg self-start"
                                    onPress={() => router.replace("/(front_desk)/setup-password")}
                                >
                                    <Text className="text-white font-poppins-medium text-sm">
                                        Complete Setup
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {user && (
                    <UserProfileCard
                        user={user}
                        profile={profile}
                        onPress={handleProfilePress}
                    />
                )}

                <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-xl border border-neutral-200 dark:border-darkBorder">
                    <SecurityCard 
                        disabled={isPasswordSetupComplete === false}
                        warning={isPasswordSetupComplete === false}
                    />
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
            </ScrollView>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            />

            <Modal
                visible={!!passwordSetupModal}
                onClose={() => setPasswordSetupModal(null)}
                title={passwordSetupModal?.title ?? ""}
                message={passwordSetupModal?.message}
                buttons={passwordSetupModal?.buttons}
            />
        </SafeAreaView>
    );
}
