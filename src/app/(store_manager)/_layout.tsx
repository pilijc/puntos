import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, useColorScheme, Platform } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Store } from 'lucide-react-native';

export default function StoreManagerLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

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
                    backgroundColor: isDark ? "#171717" : "#FFFFFF",
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
                        <Store size={22} color={color} />
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
            <Tabs.Screen
                name="store/create-store"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="view-store/[id]"
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
                name="stamp/view-stamp"
                options={{ href: null }}
            />
             <Tabs.Screen
                name="qr/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="qr/configure-qr"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="streak/view-streak"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="staff/index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="staff/view_staff"
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

const styles = StyleSheet.create({
    fabContainer: {
        top: -24,
        width: 72,
        alignItems: "center",
        justifyContent: "center",
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "#FF6600",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF6600",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 8,
    },
    fabLabel: {
        marginTop: 4,
        fontSize: 10,
        fontFamily: "Poppins-Medium",
        color: "#FF6600",
    },
    fabCompactContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 10,
    },
    fabCompact: {
        width: 30,
        height: 22,
        borderRadius: 9,
        backgroundColor: "#FF6600",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF6600",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    fabCompactLabel: {
        marginTop: 3,
        fontSize: 10,
        fontFamily: "Poppins-Medium",
        color: "#FF6600",
    },
});

