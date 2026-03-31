import { Tabs } from "expo-router";
import React from "react";
import { useSuperAdminLayout } from "@/hooks/super-admin/use-super-admin-layout";
import { LayoutDashboard, Users, Store, Settings } from 'lucide-react-native';

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuperAdminLayout() {
  useSuperAdminLayout();

  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF6600",
        tabBarInactiveTintColor: "#8B8D98",
        tabBarLabelStyle: { 
          fontSize: 10, 
          fontFamily: "Poppins-Medium",
          marginBottom: insets.bottom > 0 ? 0 : 5 
        },
        tabBarStyle: { 
          backgroundColor: "#FFFFFF", 
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60 + insets.bottom, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color }) => (
            <Users size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "Stores",
          tabBarIcon: ({ color }) => (
            <Store size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
              <Settings size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}