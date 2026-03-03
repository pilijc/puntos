import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import { supabase } from "@/supabase/supabase";

export default function FrontDeskProfile() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.replace("/(onboarding)/index");
        } catch (error: any) {
            Alert.alert("Logout error", error?.message || "Unable to logout right now.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted p-6">
            <View className="flex-1 w-full max-w-sm mt-4">
                <Text className="text-2xl font-poppins-bold mb-6">Profile</Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-primary w-full py-4 rounded-xl items-center"
                >
                    <Text className="text-white text-base font-poppins-semibold">
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
