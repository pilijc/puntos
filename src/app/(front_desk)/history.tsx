import React from "react";
import { SafeAreaView, Text, View } from "@/tw";

export default function FrontDeskHistory() {
    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted items-center justify-center p-6">
            <View className="items-center w-full max-w-sm">
                <Text className="text-2xl font-poppins-bold mb-2">History</Text>
                <Text className="text-sm font-poppins text-textMuted text-center">
                    Recent transactions and scanned points history will appear here.
                </Text>
            </View>
        </SafeAreaView>
    );
}
