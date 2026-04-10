import React from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, User } from "lucide-react-native";
import { Image } from "expo-image";

interface UserProfileCardProps {
    user: any;
    profile: any;
    onPress: () => void;
}

export const UserProfileCard = ({ profile, user, onPress }: UserProfileCardProps) => {
    const displayName = profile?.name || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";
    const avatarUrl = profile?.avatar_url || profile?.avatarUrl || profile?.logo;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-background dark:bg-darkBackgroundMuted rounded-xl p-3 border border-border dark:border-darkBorder active:bg-backgroundCard dark:active:bg-darkBackgroundCard"
        >
            <View className="flex-row items-center">
                {/* Avatar */}
                <View className="h-14 w-14 rounded-full bg-primary/10 items-center justify-center mr-4 overflow-hidden border border-border dark:border-darkBorder">
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="none"
                        />
                    ) : (
                        <User size={24} color="#FF6600" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text className="text-sm font-poppins-regular text-textSecondary dark:text-darkTextSecondary" numberOfLines={1}>
                        {email}
                    </Text>
                </View>

                {/* Edit Icon */}
                <View className="ml-2">
                    <ChevronRight size={20} color="#94a3b8" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
