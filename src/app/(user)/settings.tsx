import { View, Text, SafeAreaView, TouchableOpacity } from "@/tw";
import { useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";

import { getCurrentLocation } from "@/services/location-service";
import { useProfile } from "@/hooks/use-profile";
 
// Components
import EditProfileModal from "@/components/settings/modal/EditProfileModal";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { UserProfileCard } from "@/components/settings/card/UserProfileCard";
import { SecurityCard } from "@/components/settings/card/SecurityCard";
import { LanguageCard } from "@/components/settings/card/LanguageCard";
import { AppearanceCard } from "@/components/settings/card/AppearanceCard";
import { NotificationCard } from "@/components/settings/card/NotificationCard";
import { LocationCard } from "@/components/settings/card/LocationCard";
import {CustomTabBarButton} from "@/components/qr/qr-button";
import { useTranslation } from "react-i18next";

// Services
import { syncLocationService } from "@/services/settings-service";

export default function UserSettings() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { t: translate } = useTranslation();

  const {
    user,
    profile,
    loading,
    preferences,
    updatePreferences,
    refreshProfile
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
      <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground justify-center items-center">
        <Text className="text-neutral-500 font-poppins-regular">{translate("index.loadingProfile")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground p-4">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
          {translate('settings.title')}
          <CustomTabBarButton onPress={() => {}} bottomInset={0} />
        </Text>
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
        <Text className="mx-4 text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
          {translate('settings.account.title')}
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-xl border border-neutral-200 dark:border-darkBorder">
        <SecurityCard />
        <LanguageCard />
        <AppearanceCard />
      </View>

      {/* Preferences Section */}
      <View>
        <Text className="mx-4 text-sm font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary mb-2">
          {translate('settings.notificationsPrivacy.title')}
        </Text>
      </View>

      <View className="mx-4 mb-6 overflow-hidden bg-background dark:bg-darkBackgroundMuted rounded-xl border border-neutral-200 dark:border-darkBorder">
        <NotificationCard />
        <LocationCard />
      </View>

      <LogoutButton />

      {/* Footer */}
      <View className="mx-8 mt-6 items-center">
        <Text className="text-sm text-center font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">
          {translate("settings.copyright")} 2026
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
