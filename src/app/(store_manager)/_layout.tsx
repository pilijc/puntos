import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";

export default function StoreManagerLayout() {
    const router = useRouter();

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    router.replace("/(onboarding)/welcome");
                    return;
                }

                const roleType = await getRoleTypeForUser(user.id);
                if (roleType !== "manager" && roleType !== "store_owner") {
                    if (roleType === "super_admin") {
                        router.replace("/(super_admin)");
                    } else if (roleType === "front_desk") {
                        router.replace("/(front_desk)");
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
                tabBarStyle: { backgroundColor: "#FFFFFF", height: 70, paddingBottom: 8 },
                tabBarActiveTintColor: "#FF6600",
                tabBarInactiveTintColor: "#8B8D98",
                tabBarLabelStyle: { fontSize: 11, fontFamily: "Poppins-Medium" },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={22} name="dashboard" color={color} />
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
                name="features"
                options={{
                    title: "Features",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={22} name="apps" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: "Analytics",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={22} name="bar-chart" color={color} />
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
            <Tabs.Screen
                name="profile"
                options={{ href: null }}
            />
        </Tabs>
    );
}
