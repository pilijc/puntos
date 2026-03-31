import { Tabs } from "expo-router";
import { StyleSheet, useColorScheme, Platform, Text } from "react-native";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Store, ArrowLeftRight, Settings } from 'lucide-react-native';

export default function StoreManagerLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const path = pathname.endsWith("/") ? pathname : `${pathname}/`;

    const activeColor = "#FF6600";

    const isStoresSection =
        path.startsWith("/(store_manager)/stores/") ||
        path.startsWith("/(store_manager)/view-store/") ||
        path.startsWith("/(store_manager)/store/") ||
        path.startsWith("/(store_manager)/reward/") ||
        path.startsWith("/(store_manager)/stamp/") ||
        path.startsWith("/(store_manager)/streak/") ||
        path.startsWith("/(store_manager)/qr/") ||
        path.startsWith("/(store_manager)/staff/") ||
        path.startsWith("/(store_manager)/detail/") ||
        path.startsWith("/stores/") ||
        path.startsWith("/view-store/") ||
        path.startsWith("/store/") ||
        path.startsWith("/reward/") ||
        path.startsWith("/stamp/") ||
        path.startsWith("/streak/") ||
        path.startsWith("/qr/") ||
        path.startsWith("/staff/") ||
        path.startsWith("/detail/");

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

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
                tabBarStyle: {
                    backgroundColor: isDark ? "#262626" : "#FFFFFF",
                    borderTopColor: isDark ? "#404040" : "#e5e5e5",
                    height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    elevation: 0,
                },
                tabBarActiveTintColor: "#FF6600",
                tabBarInactiveTintColor: isDark ? "#737373" : "#8B8D98",
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontFamily: "Poppins-Medium",
                    marginBottom: insets.bottom > 0 ? 0 : 4
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                        <LayoutDashboard size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stores"
                options={{
                    title: "Stores",
                    tabBarIcon: ({ color }) => (
                        <Store size={22} color={isStoresSection ? activeColor : color} />
                    ),
                    tabBarLabel: ({ color }) => (
                        <Text
                            style={{
                                fontSize: 10,
                                fontFamily: "Poppins-Medium",
                                marginBottom: insets.bottom > 0 ? 0 : 4,
                                color: isStoresSection ? activeColor : color,
                            }}
                        >
                            Stores
                        </Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Transactions",
                    tabBarIcon: ({ color }) => (
                        <ArrowLeftRight size={22} color={color} />
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
            <Tabs.Screen
                name="profile"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="store/create-store"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="view-store/[id]"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="streak/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="streak/configure-streaks"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="stamp/configure-stamp"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="stamp/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="reward/rewards"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="reward/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="reward/add-rewards"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="qr/index"
                options={{ href: null }}
            /> */}
            <Tabs.Screen
                name="qr/configure-qr"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="staff/index"
                options={{ href: null }}
            />

            <Tabs.Screen
                name="staff/add-staff"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="detail/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="detail/edit-details"
                options={{ href: null }}
            />
        </Tabs>
    );
}