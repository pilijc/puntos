import React from "react";
import { SafeAreaView, Text, View } from "@/tw";

export default function SuperAdminUsers() {
    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted items-center justify-center p-6">
            <View className="items-center w-full max-w-sm">
                <Text className="text-2xl font-poppins-bold mb-2">Manage Users</Text>
                <Text className="text-sm font-poppins text-textMuted text-center">
                    Admin user management controls will appear here.
                </Text>
            </View>
        </SafeAreaView>
    );
}
