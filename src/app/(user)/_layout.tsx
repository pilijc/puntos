import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Compass, Store, History, Settings } from 'lucide-react-native';
import { useProfile } from '@/hooks/user/use-profile';
import { useLocationSync } from '@/hooks/user/use-location-sync';
import { getMutedStores } from '@/services/user/mute-service';
import { useStoreStore } from '@/store/user/store-store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, preferences } = useProfile();
  useLocationSync(user?.id, preferences?.location_enabled ?? false);
  const { setMutedStoreIds } = useStoreStore();

  useEffect(() => {
    if (user?.id) {
      getMutedStores()
        .then(setMutedStoreIds)
        .catch(console.error);
    }
  }, [user?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#262626' : '#FFFFFF',
          borderTopColor: isDark ? '#404040' : '#e5e5e5',
          height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: isDark ? '#737373' : '#8B8D98',
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Poppins-Medium',
          marginBottom: insets.bottom > 0 ? 0 : 4
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: translate("layout.discover"),
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: translate("layout.store"),
          tabBarIcon: ({ color }) => <Store size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: translate("layout.history"),
          tabBarIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate("layout.settings"),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{ href: null }}
      />
    </Tabs>
  );
}

