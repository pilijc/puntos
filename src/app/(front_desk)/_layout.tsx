import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { Platform, View, StyleSheet, useColorScheme } from "react-native";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRRoundedButton from "@/components/qr/qr-rounded";
import { getCurrentUserIsActive } from "@/services/operator-service";
import { useTranslation } from "react-i18next";

export default function FrontDeskLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isActive, setIsActive] = React.useState<boolean>(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t: translate } = useTranslation();

    useEffect(() => {
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (!session) {
                    router.replace("/(auth)/login");
                    return;
                }

                const user = session.user;
                if (!user) return;

                try {
                    const activeStatus = await getCurrentUserIsActive();
                    setIsActive(activeStatus);

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
            }
            );


        const verifyAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const activeStatus = await getCurrentUserIsActive();
                setIsActive(activeStatus);
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
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

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
                    fontSize: 12,
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
                        <MaterialIcons size={24} name="history" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: "",
                    tabBarIcon: () => null,
                    tabBarButton: (props: any) => isActive ? (
                        <QRRoundedButton onPress={props.onPress} bottomInset={insets.bottom} />
                    ) : null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: translate("layout.settings"),
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={24} name="person" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
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