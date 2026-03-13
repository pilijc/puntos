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
import EditProfileModal from "@/components/settings/EditProfileModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import { SecurityCard } from "@/components/settings/SecurityCard";
import DarkModeToggle from "@/components/ui/dark-mode-toggle";

// Services
import { syncLocationService } from "@/services/settings-service";

export default function UserSettings() {
  const [editModalVisible, setEditModalVisible] = useState(false);

  const {
    user,
    profile,
    loading,
    preferences,
    updatePreferences,
    refreshProfile
  } = useProfile();

  const {
    permissionStatus,
    loading: locationLoading,
    requestPermission: requestLocationPermission,
  } = useLocation();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  const togglePreference = async (key: string) => {
    const newValue = !(preferences as any)[key];
    await updatePreferences({ [key]: newValue });
  };

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

      {/* Account Section */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
          ACCOUNT SETTINGS
        </Text>
      </View>

      <SecurityCard />

      {/* Preferences Section */}
      <View>
        <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
          NOTIFICATIONS & PRIVACY
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-2xl border border-neutral-200 dark:border-darkBorder">
        <View className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted border-b border-neutral-100 dark:border-darkBorder items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Ionicons name="notifications-outline" size={18} color="#FF6600" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
              Nearby Alerts
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
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
          className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted border-b border-neutral-100 dark:border-darkBorder items-center will-change-pressable"
        >
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
            <Ionicons name="location-outline" size={18} color="#d8d336" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
              Location Access
            </Text>
            <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
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
        <View className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted items-center">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
            <Ionicons name="megaphone-outline" size={18} color="#ad2291" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
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
        <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
          Copyright 2026
        </Text>
      </View>

      {/* Modals */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </SafeAreaView>
  );
}
