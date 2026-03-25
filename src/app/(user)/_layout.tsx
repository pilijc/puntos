import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Compass, Store, History, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();  

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
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
    </Tabs>
  );
}
  
