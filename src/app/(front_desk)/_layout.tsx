import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { supabase } from "@/supabase/supabase";
import { getRoleTypeForUser } from "@/services/access-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRRoundedButton from "@/components/qr/qr-rounded";
import {getCurrentUserIsActive} from "@/services/operator-service";

export default function FrontDeskLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isActive, setIsActive] = React.useState<boolean>(false);

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
                name="history"
                options={{
                    title: "Transactions",
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
                    tabBarButton: (props: any) => isActive ?(
                        <QRRoundedButton onPress={props.onPress} bottomInset={insets.bottom} />
                    ): null,
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