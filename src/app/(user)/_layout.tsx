import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomTabBarButton } from '@/components/qr/qr-button';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
            fontSize: 12, 
            fontFamily: 'Poppins-Medium',
            marginBottom: insets.bottom > 0 ? 0 : 4
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="store" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'Qr',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={22} name="qrcode-scan" color={color} />,
          tabBarButton: (props: any) => (
            <CustomTabBarButton onPress={props.onPress} bottomInset={insets.bottom} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons size={22} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
  