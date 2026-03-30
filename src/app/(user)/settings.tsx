import { View, Text, TouchableOpacity } from "@/tw";
import { useFocusEffect, router } from "expo-router";
import React, { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

import { getCurrentLocation } from "@/services/user/location-service";
import { useProfile } from "@/hooks/use-profile";
 
// Components
import EditProfileModal from "@/components/settings/modal/edit-profile-modal";
import { LogoutButton } from "@/components/settings/logout-button";
import { UserProfileCard } from "@/components/settings/card/user-profile-card";
import { SecurityCard } from "@/components/settings/card/security-card";
import { LanguageCard } from "@/components/settings/card/language-card";
import { AppearanceCard } from "@/components/settings/card/appearance-card";
import { NotificationCard } from "@/components/settings/card/notification-card";
import { LocationCard } from "@/components/settings/card/location-card";
import { useTranslation } from "react-i18next";
import StoreScreenContainer from "@/components/ui/store-screen-container";

// Services
import { syncLocationService } from "@/services/settings-service";

function SettingsSectionLabel({ labelKey }: { labelKey: string }) {
  const { t: translate } = useTranslation();
  return (
    <Text className="text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2 ml-1">
      {translate(labelKey)}
    </Text>
  );
}

export default function UserSettings() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { t: translate } = useTranslation();

  const {
    user,
    profile,
    loading,
    preferences,
    refreshProfile,
  } = useProfile();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

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
      <StoreScreenContainer backgroundClassName="bg-backgroundMuted dark:bg-darkBackground">
        <Text className="text-neutral-500 font-poppins-regular mt-20 self-center">
          {translate("user.discover.loadingProfile")}
        </Text>
      </StoreScreenContainer>
    );
  }

  return (
    <>
      <StoreScreenContainer
        backgroundClassName="bg-backgroundMuted dark:bg-darkBackground"
        contentGap={16}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center ml-1 mt-7.5">
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            {translate("settings.title")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(user)/qr")}
            className="p-2"
          >
            <Ionicons name="qr-code-outline" size={20} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        {user && (
          <UserProfileCard
            user={user}
            profile={profile}
            onPress={handleProfilePress}
          />
        )}

        {/* Account Section */}
        <View>
          <SettingsSectionLabel labelKey="settings.account.title" />
          <View className="overflow-hidden bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder">
            <SecurityCard />
            <LanguageCard />
            <AppearanceCard />
          </View>
        </View>

        {/* Notifications & Privacy Section */}
        <View>
          <SettingsSectionLabel labelKey="settings.notificationsPrivacy.title" />
          <View className="overflow-hidden bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder">
            <NotificationCard />
            <LocationCard />
          </View>
        </View>

        <LogoutButton />

        {/* Footer */}
        <View className="items-center pt-2 pb-2">
          <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
            {translate("settings.copyright")} 2026
          </Text>
        </View>
      </StoreScreenContainer>

      {/* Modals */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </>
  );
}
