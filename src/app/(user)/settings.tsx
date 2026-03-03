import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Alert, Switch, Linking, useColorScheme } from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useLocation } from "@/hooks/use-location";
import { getCurrentLocation } from "@/services/location-service";
import { useProfile } from "@/hooks/use-profile";
import { useAuthActions } from "@/hooks/use-authActions";

// Components
import DarkModeToggle from "@/components/ui/dark-mode-toggle";
import EditProfileModal from "@/components/settings/EditProfileModal";
import SecurityModal from "@/components/settings/SecurityModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/UserProfileCard";

// Services (Used for background tasks like location sync)
import { syncLocationService } from "@/services/settings-service";

/**
 * User Settings Screen
 * Allows regular users to manage their profile, security, and notification preferences.
 */
export default function UserSettings() {
  // Modal State Management
  const [modalVisible, setModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);

  // Profile and Preferences Hook
  const {
    user,
    profile,
    loading,
    preferences,
    updatePreferences,
    updateProfile,
    refreshProfile
  } = useProfile();

  // Location Hook for permissions and data
  const {
    permissionStatus,
    loading: locationLoading,
    requestPermission: requestLocationPermission,
  } = useLocation();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  /**
   * Helper to toggle preferences using the consolidated updatePreferences function
   * @param key The preference key to toggle
   */
  const togglePreference = async (key: string) => {
    const newValue = !(preferences as any)[key];
    await updatePreferences({ [key]: newValue });
  };

  /**
   * Background effect to sync location to DB if enabled
   */
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const syncLocationToDB = async () => {
      if (!user?.id) return;
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          await syncLocationService(user.id, loc.latitude, loc.longitude);
        }
      } catch (e) {
        console.error("Failed to sync location to DB:", e);
      }
    };

    if (preferences.location_enabled) {
      syncLocationToDB();
      intervalId = setInterval(syncLocationToDB, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [preferences.location_enabled, user?.id]);

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
  // ---------------------------

  // Show loading skeleton until profile is ready
  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-neutral-900 justify-center items-center">
        <Text className="text-neutral-500 font-poppins-regular">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-neutral-900 p-4">
      {/* Header with Dark Mode Toggle */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
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

      {/* Account Section */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-neutral-400 mb-2">
          ACCOUNT SETTINGS
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity
          onPress={() => setSecurityModalVisible(true)}
          className="flex-row items-center p-4 bg-white dark:bg-neutral-800 active:bg-neutral-50 dark:active:bg-neutral-700 will-change-pressable">
          <View className="h-5 w-5 items-center justify-center rounded-lg bg-emerald-50">
            <Ionicons name="settings-outline" size={15} color="#3b82f6" />
          </View>
          <Text className="text-base flex-1 ml-3 font-poppins-semibold text-neutral-900 dark:text-white">
            Security
          </Text>
          <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-neutral-400 mb-2">
          NOTIFICATIONS & PRIVACY
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background rounded-2xl border border-neutral-200 dark:border-neutral-700">
        {/* Nearby Alerts Switch */}
        <View className="flex-row p-4 bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Ionicons name="notifications-outline" size={18} color="#FF6600" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-white">
              Nearby Alerts
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-neutral-500">
              Get notified when rewards are close
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
            thumbColor="#FFFFFF"
            value={preferences.near_store_notifications}
            onValueChange={() => togglePreference('near_store_notifications')}
          />
        </View>

        {/* Location Permission Toggle */}
        <TouchableOpacity
          onPress={async () => {
            if (preferences.location_enabled) {
              Alert.alert(
                "Disable Location Access",
                "To completely revoke location permissions, you must disable the setting in your device's settings menu. Would you like to open it now?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      togglePreference('location_enabled');
                      Linking.openSettings();
                    }
                  }
                ]
              );
            } else {
              if (!permissionStatus.granted) {
                await requestLocationPermission();
              }
              togglePreference('location_enabled');
            }
          }}
          className="flex-row p-4 bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 items-center will-change-pressable"
        >
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
            <Ionicons name="location-outline" size={18} color="#d8d336" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-white">
              Location Access
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-neutral-500">
              {locationLoading ? "Checking..." : permissionStatus.granted ? "Access Granted" : "Access Denied"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm font-poppins-semibold text-primary mr-2">
              {preferences.location_enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Ionicons name="chevron-forward-outline" size={15} color="#d4d4d4" />
          </View>
        </TouchableOpacity>

        {/* Promo Emails Switch */}
        <View className="flex-row p-4 bg-white dark:bg-neutral-800 items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
            <Ionicons name="megaphone-outline" size={18} color="#ad2291" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-white">
              Promotional Emails
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
            thumbColor="#FFFFFF"
            value={preferences.promo_emails}
            onValueChange={() => togglePreference('promo_emails')}
          />
        </View>
      </View>

      <LogoutButton />

      {/* Footer */}
      <View className="mx-8 mt-6 items-center">
        <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-neutral-400">
          Copyright 2026
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

      <SecurityModal visible={securityModalVisible} onClose={() => setSecurityModalVisible(false)} />
    </SafeAreaView>
  );
}
