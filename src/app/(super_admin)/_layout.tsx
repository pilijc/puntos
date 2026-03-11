import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuperAdminLayout() {
  const router = useRouter();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const roleType = await getRoleTypeForUser(user.id);
        if (roleType !== "super_admin") {
          router.replace("/(user)");
        }
      } catch {
        router.replace("/(user)");
      }
    };
    verifyAccess();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF6600",
        tabBarInactiveTintColor: "#8B8D98",
        tabBarLabelStyle: { 
          fontSize: 12, 
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
            <MaterialIcons size={22} name="dashboard" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="groups" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "Stores",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="storefront" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}