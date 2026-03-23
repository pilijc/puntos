import React from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";

interface UserProfileCardProps {
    user: any;
    profile: any;
    onPress: () => void;
}

export const UserProfileCard = ({ profile, user, onPress }: UserProfileCardProps) => {
    const displayName = profile?.name || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";
    // Check multiple possible field names to be safe
    const avatarUrl = profile?.avatar_url || profile?.avatarUrl || profile?.logo;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="mx-4 mb-6 bg-background dark:bg-darkBackgroundMuted rounded-2xl p-4 border border-neutral-200 dark:border-darkBorder active:bg-neutral-50 dark:active:bg-darkBackgroundCard will-change-pressable"
        >
            <View className="flex-row items-center">
                {/* Avatar */}
                <View className="h-14 w-14 rounded-full bg-primary/10 items-center justify-center mr-4 overflow-hidden border border-neutral-200 dark:border-darkBorder">
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="none"
                        />
                    ) : (
                        <Ionicons name="person-outline" size={24} color="#FF6600" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-darkTextPrimary" numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary" numberOfLines={1}>
                        {email}
                    </Text>
                </View>

                {/* Edit Icon */}
                <View className="ml-2">
                    <Ionicons name="chevron-forward-outline" size={20} color="#d4d4d4" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
