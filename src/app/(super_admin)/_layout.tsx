import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";

export default function SuperAdminLayout() {
  const router = useRouter();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Auth listener owns the SIGNED_OUT redirect; returning here avoids a race
          return;
        }

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
        tabBarStyle: { backgroundColor: "#FFFFFF", height: 70, paddingBottom: 8 },
        tabBarActiveTintColor: "#FF6600",
        tabBarInactiveTintColor: "#8B8D98",
        tabBarLabelStyle: { fontSize: 12, fontFamily: "Poppins-Medium" },
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
