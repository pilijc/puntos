import React from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, UserRound } from "lucide-react-native";
import { Image } from "expo-image";

interface UserProfileCardProps {
    user?: any;
    profile?: any;
    onPress?: () => void;
    loading?: boolean;
}

export const UserProfileCard = ({ profile, user, onPress, loading = false }: UserProfileCardProps) => {
    const displayName = profile?.name || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";
    const avatarUrl = profile?.avatar_url || profile?.avatarUrl || profile?.logo;

    return (
        <TouchableOpacity
            onPress={loading ? undefined : onPress}
            disabled={loading}
            className="bg-white dark:bg-darkBackground rounded-xl px-3 py-3 active:bg-slate-50 dark:active:bg-darkBackgroundCard"
        >
            <View className="flex-row items-center">
                {/* Avatar */}
                <View className="h-14 w-14 rounded-full bg-primary/5 items-center justify-center mr-4 overflow-hidden">
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="none"
                        />
                    ) : (
                        <UserRound size={24} color="#FF6600" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    {loading ? (
                        <View className="gap-y-2">
                            <View className="h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-700" />
                            <View className="h-4 w-56 rounded-md bg-slate-200 dark:bg-slate-700" />
                        </View>
                    ) : (
                        <>
                            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                                {displayName}
                            </Text>
                            <Text className="text-sm font-poppins-regular text-textSecondary dark:text-darkTextSecondary -mt-1" numberOfLines={1}>
                                {email}
                            </Text>
                        </>
                    )}
                </View>

                {/* Edit Icon */}
                <View className="ml-2">
                    <ChevronRight size={16} color="#94a3b8" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
