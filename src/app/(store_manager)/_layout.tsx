import { Tabs, usePathname } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { useEffect, useRef } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from "react-native-reanimated";
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
                    router.replace("/(onboarding)/index");
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
                    tabBarIcon: () => null,
                    tabBarLabel: () => null,
                    tabBarButton: (props: any) => (
                        <CustomTabBarButton onPress={props.onPress} />
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
                name="create-store"
                options={{ href: null }}
            />
        </Tabs>
    );
}

function CustomTabBarButton({ onPress }: { onPress?: () => void }) {
    const pathname = usePathname();
    const isCompact = pathname.includes("create-store");

    // 0 = fully compact, 1 = fully full FAB
    const progress = useSharedValue(isCompact ? 0 : 1);

    useEffect(() => {
        progress.value = withTiming(isCompact ? 0 : 1, { duration: 220 });
    }, [isCompact]);

    // Full FAB: fades + scales out when going compact
    const fullStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1]) }],
    }));

    // Compact icon: fades + scales in when going compact
    const compactStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [1, 0]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.55]) }],
    }));

    const pressScale = useSharedValue(1);
    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => { pressScale.value = withTiming(0.88, { duration: 100 }); }}
            onPressOut={() => { pressScale.value = withTiming(1, { duration: 150 }); }}
            style={isCompact ? styles.fabCompactContainer : styles.fabContainer}
        >
            <Animated.View style={pressStyle}>
                {/* Full FAB — fades out when compact */}
                <Animated.View style={[{ alignItems: "center" }, fullStyle]} pointerEvents={isCompact ? "none" : "auto"}>
                    <View style={styles.fab}>
                        <MaterialIcons name="auto-awesome" size={26} color="#FFFFFF" />
                    </View>
                    <Text style={styles.fabLabel}>Features</Text>
                </Animated.View>

                {/* Compact icon — fades in when compact */}
                <Animated.View
                    style={[{ alignItems: "center", position: "absolute", top: 0 }, compactStyle]}
                    pointerEvents={isCompact ? "auto" : "none"}
                >
                    <View style={styles.fabCompact}>
                        <MaterialIcons name="auto-awesome" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.fabCompactLabel}>Features</Text>
                </Animated.View>
            </Animated.View>
        </Pressable>
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

