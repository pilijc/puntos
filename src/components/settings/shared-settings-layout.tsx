import React, { useState, useCallback } from "react";
import { Platform } from "react-native";
import { View, Text, ScrollView, SafeAreaView } from "@/tw";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "@/hooks/user/use-profile";

// components
import EditProfileModal from "@/components/settings/modal/edit-profile-modal";
import { LogoutButton } from "@/components/settings/logout-button";
import { UserProfileCard } from "@/components/settings/card/user-profile-card";
import { SecurityCard } from "@/components/settings/card/security-card";
import { LanguageCard } from "@/components/settings/card/language-card";
import { AppearanceCard } from "@/components/settings/card/appearance-card";
import { SubscriptionCard } from "@/components/settings/card/subscription-card";
import { ChatSupportCard } from "@/components/settings/card/chat-support-card";

interface SharedSettingsLayoutProps {
    headerRight?: React.ReactNode;
    extraCards?: React.ReactNode;
    copyrightRole: string;
    securityDisabled?: boolean;
    securityWarning?: boolean;
    banner?: React.ReactNode;
}

export const SharedSettingsLayout = ({
    headerRight,
    extraCards,
    copyrightRole,
    securityDisabled = false,
    securityWarning = false,
    banner
}: SharedSettingsLayoutProps) => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { t: translate } = useTranslation();
    const { user, profile, loading, refreshProfile } = useProfile();
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === "web";

    useFocusEffect(useCallback(() => { refreshProfile(); }, []));

    const scrollBottom = Math.max(insets.bottom, 40);

    return (
        <>
            <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
                <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row justify-between items-center">
                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">
                        {translate('settings.title')}
                    </Text>
                    {headerRight ? headerRight : <View className="w-10 h-10 opacity-0" />}
                </View>

                <ScrollView
                    className="flex-1"
                    contentInsetAdjustmentBehavior="never"
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: scrollBottom,
                        ...(isWeb ? { alignItems: "center" as const } : {}),
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className={isWeb ? "w-full max-w-4xl gap-4" : "w-full gap-4"}>
                        <View>
                            <UserProfileCard
                                user={user}
                                profile={profile}
                                loading={loading && !user}
                                onPress={() => setEditModalVisible(true)}
                            />
                        </View>

                        {banner}

                        <View className="overflow-hidden bg-white dark:bg-darkBackground rounded-xl border border-slate-100 dark:border-slate-800">
                            <SecurityCard
                                disabled={securityDisabled}
                                warning={securityWarning}
                            />
                            <View className="h-px bg-slate-100 dark:bg-slate-800" />
                            <LanguageCard />
                            <View className="h-px bg-slate-100 dark:bg-slate-800" />
                            <AppearanceCard />
                            {copyrightRole === "Store Manager" ? (
                              <>
                                <View className="h-px bg-slate-100 dark:bg-slate-800" />
                                <SubscriptionCard />
                                <View className="h-px bg-slate-100 dark:bg-slate-800" />
                                <ChatSupportCard />
                                <View className="h-px bg-slate-100 dark:bg-slate-800" />
                              </>
                            ) : null}
                        </View>

                        {extraCards}

                        <LogoutButton />
                    </View>

                    {/* <View className="items-center pb-2">
                        <Text className="text-[10px] tracking-[2px] text-textMuted font-poppins-medium">
                            {translate("settings.copyright")} 2026 {copyrightRole}
                        </Text>
                    </View> */}
                </ScrollView>
            </SafeAreaView>

            <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} />
        </>
    );
};
