import React from "react";
import { Alert, Platform } from "react-native";
import { SafeAreaView, View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { markIntentionalSignOut } from "@/lib/intentional-signout";
import { useDeviceSession } from "@/hooks/store-manager/use-device-session";
import { useIsDark } from "@/hooks/use-is-dark";

export default function StoreManagerProfile() {
    const { signOutCurrentDevice } = useDeviceSession();
    const isDark = useIsDark();

    const handleLogout = async () => {
        if (Platform.OS === "web") {
            const confirmed = window.confirm("Are you sure you want to log out?");
            if (confirmed) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) await signOutCurrentDevice(user.id);
                markIntentionalSignOut();
                await supabase.auth.signOut();
                router.replace("/(onboarding)/welcome");
            }
            return;
        }

        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await signOutCurrentDevice(user.id);
                    
                    markIntentionalSignOut();
                    await supabase.auth.signOut();
                    router.replace("/(onboarding)/welcome");
                },
            },
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
            <View className="flex-1 items-center justify-center px-6 gap-y-6">
                <View className="w-[72px] h-[72px] rounded-full bg-orange-50 dark:bg-orange-950/20 items-center justify-center">
                    <MaterialIcons name="person" size={40} color="#FF6600" />
                </View>
                <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                    Store Manager
                </Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="w-full py-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex-row items-center justify-center gap-x-2"
                >
                    <MaterialIcons name="logout" size={20} color="#FF6600" />
                    <Text className="text-sm font-poppins-bold text-primary">
                        Log Out
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
