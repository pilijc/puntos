import React from "react";
import { TouchableOpacity, View } from "@/tw";
import { router } from "expo-router";
import { ScanQrCode } from "lucide-react-native";
import { SharedSettingsLayout } from "@/components/settings/shared-settings-layout";
import { NotificationCard } from "@/components/settings/card/notification-card";
import { LocationCard } from "@/components/settings/card/location-card";

export default function UserSettings() {
  const extraCards = (
    <View className="overflow-hidden bg-background dark:bg-darkBackgroundCard rounded-xl border border-border dark:border-darkBorder">
      <NotificationCard />
      <View className="h-[1px] bg-border dark:bg-darkBorder" />
      <LocationCard />
    </View>
  );

  const QrButton = (
    <TouchableOpacity onPress={() => router.push("/(user)/qr")} className="p-2">
      <ScanQrCode size={20} color="#FF6600" />
    </TouchableOpacity>
  );

  return <SharedSettingsLayout headerRight={QrButton} extraCards={extraCards} copyrightRole="User" />
}