import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FrontDeskLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const roleType = await getRoleTypeForUser(user.id);
                if (roleType !== "front_desk") {
                    if (roleType === "super_admin") {
                        router.replace("/(super_admin)");
                    } else {
                        router.replace("/(user)");
                    }
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
                tabBarStyle: { 
                    backgroundColor: "#FFFFFF", 
                    height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom, 
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                },
                tabBarActiveTintColor: "#FF6600",
                tabBarInactiveTintColor: "#8B8D98",
                tabBarLabelStyle: { 
                    fontSize: 12, 
                    fontFamily: "Poppins-Medium",
                    marginBottom: insets.bottom > 0 ? 0 : 4
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Scan",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={24} name="qr-code-scanner" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={24} name="history" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={24} name="person" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}