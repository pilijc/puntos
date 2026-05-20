import { Tabs, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme, Platform, AppState } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Compass, Store, History, Settings } from 'lucide-react-native';
import { useProfile } from '@/hooks/user/use-profile';
import { useLocationSync } from '@/hooks/user/use-location-sync';
import { useStoreStore } from '@/store/user/store-store';
import { refreshUserDeviceHeartbeatService } from '@/services/user/device-session-service';
import { useMutedStoresQuery } from '@/hooks/user/rq';


import { useIsDark } from '@/hooks/use-is-dark';


function UserTabs() {
  const isDark = useIsDark();
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, preferences } = useProfile();
  useLocationSync(user?.id, preferences?.location_enabled ?? false);
  const { setMutedStoreIds, setMutedStoresHydrated } = useStoreStore();
  const mutedStoresQuery = useMutedStoresQuery(user?.id);

  useEffect(() => {
    if (user?.id) {
      setMutedStoresHydrated(false);
    } else {
      setMutedStoreIds([]);
      setMutedStoresHydrated(false);
    }
  }, [user?.id, setMutedStoreIds, setMutedStoresHydrated]);

  useEffect(() => {
    if (!user?.id) return;

    if (mutedStoresQuery.data) {
      setMutedStoreIds(mutedStoresQuery.data);
      setMutedStoresHydrated(true);
    } else if (mutedStoresQuery.isError) {
      console.error("[Mute] fetch failed:", mutedStoresQuery.error);
      setMutedStoresHydrated(true);
    } else {
      setMutedStoresHydrated(false);
    }
  }, [
    user?.id,
    mutedStoresQuery.data,
    mutedStoresQuery.error,
    mutedStoresQuery.isError,
    setMutedStoreIds,
    setMutedStoresHydrated,
  ]);

  // Keep the user's device session alive while they are actively using the app
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const pulse = () => { refreshUserDeviceHeartbeatService(userId).catch(() => {}); };

    // ping when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') pulse();
    });
    // also ping every 1 minute while app is open
    const intervalId = setInterval(pulse, 1 * 60 * 1000);

    return () => {
      appStateSub.remove();
      clearInterval(intervalId);
    };
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
        options={{
          href: null,
          tabBarStyle: {
            height: 0,
            paddingBottom: 0,
            marginBottom: 0,
          },
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === "web") {
    return <Redirect href="/web-unavailable" />;
  }
  return <UserTabs />;
}
