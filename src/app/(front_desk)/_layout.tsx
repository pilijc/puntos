import { Tabs, usePathname, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Platform, View, StyleSheet, useColorScheme, AppState } from "react-native";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUserIsActive } from "@/services/frontdesk/scan-service";
import { checkPasswordSetupRequired } from "@/services/frontdesk/password-service";
import { useTranslation } from "react-i18next";
import { History, Settings, ScanLine } from 'lucide-react-native';
import { refreshFrontdeskDeviceHeartbeatService } from "@/services/frontdesk/device-session-service";
import { useAuthActions } from "@/hooks/use-auth-actions";

import { useIsDark } from "@/hooks/use-is-dark";

function FrontDeskTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const [isActive, setIsActive] = useState(false);
    const isDark = useIsDark();
    const { t: translate } = useTranslation();
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const { handleLogout } = useAuthActions();

    const isOnPasswordSetup = pathname.includes('setup-password');

    useEffect(() => {
        const verifyFrontDeskAccess = async (userId: string) => {
            setCurrentUserId(userId);

            try {
                const activeStatus = await getCurrentUserIsActive();
                setIsActive(activeStatus);

                const roleType = await getRoleTypeForUser(userId);

                if (roleType !== "front_desk") {
                    if (roleType === "super_admin") {
                        router.replace("/(super_admin)");
                    } else {
                        router.replace("/(user)");
                    }
                    return;
                }

                // Enforce session limit on direct navigation bypass
                const { getHomeRouteForUserId } = require("@/services/access-service");
                const { getWebAdjustedHomeRoute } = require("@/services/access-service");
                const { registerDeviceSessionForRoute } = require("@/services/shared/device-session-route-service");
                const nextRoute = getWebAdjustedHomeRoute(await getHomeRouteForUserId(userId));
                const sessionCheck = await registerDeviceSessionForRoute(userId, nextRoute);
                if (!sessionCheck.allowed) {
                    await handleLogout();
                    return;
                }

                const requiresPasswordSetup = await checkPasswordSetupRequired(userId);
                if (requiresPasswordSetup) {
                    router.replace("/(front_desk)/setup-password");
                    return;
                }
            } catch {
                router.replace("/(user)");
            }
        };

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === "USER_UPDATED") return;

                if (!session) {
                    router.replace("/(auth)/login");
                    return;
                }

                const user = session.user;
                if (!user) return;

                void verifyFrontDeskAccess(user.id);
            }
            );

        const verifyAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await verifyFrontDeskAccess(user.id);
            } catch {
                router.replace("/(user)");
            }
        };
        verifyAccess();
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Keep the front desk device session alive while the app is in use
    useEffect(() => {
        if (!currentUserId) return;
        const userId = currentUserId;

        const pulse = () => { refreshFrontdeskDeviceHeartbeatService(userId).catch(() => {}); };

        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') pulse();
        });
        const intervalId = setInterval(pulse, 1 * 60 * 1000);

        return () => {
            appStateSub.remove();
            clearInterval(intervalId);
        };
    }, [currentUserId]);


    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: isDark ? '#262626' : '#FFFFFF',
                    height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? '#171717' : '#e5e5e5',
                },
                tabBarActiveTintColor: "#FF6600",
                tabBarInactiveTintColor: isDark ? '#737373' : '#8B8D98',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontFamily: "Poppins-Medium",
                    marginBottom: insets.bottom > 0 ? 0 : 4
                },
            }}
        >
            <Tabs.Screen
                name="history"
                options={{
                    title: translate("layout.transactions"),
                    tabBarIcon: ({ color }) => (
                        <History size={22} color={color} />
                    ),
                    href: isOnPasswordSetup ? null : undefined,
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: translate("layout.scan"),
                    tabBarIcon: ({color}) => (
                        <ScanLine size={24} color={color} />
                    ),
                    href: isOnPasswordSetup ? null : undefined,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: translate("layout.settings"),
                    tabBarIcon: ({ color }) => (
                        <Settings size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="setup-password"
                options={{
                    href: null, 
                }}
            />
        </Tabs>
    );
}

export default function FrontDeskLayout() {
    if (Platform.OS === "web") {
        return <Redirect href="/web-unavailable" />;
    }
    return <FrontDeskTabs />;
}

const styles = StyleSheet.create({
    fabContainer: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF6600',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
});
