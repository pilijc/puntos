import React from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';

interface SecurityCardProps {
    onPress: () => void;
}

export const SecurityCard = ({ onPress }: SecurityCardProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="mx-4 mb-6 bg-background dark:bg-darkBackgroundMuted rounded-xl p-4 border border-neutral-200 dark:border-darkBorder"
        >
            <View className="flex-row items-center">

                <View className="h-10 w-10 rounded-lg bg-emerald-50 items-center justify-center ">
                    <Ionicons name="settings-outline" size={15} color="#3b82f6" />
                </View>

                <Text className="flex-1 ml-3 text-base font-poppins-semibold dark:text-darkTextPrimary">
                    Security
                </Text>

                <Ionicons name="chevron-forward-outline" size={18} color="#d4d4d4" />
            </View>
        </TouchableOpacity>
    );
};