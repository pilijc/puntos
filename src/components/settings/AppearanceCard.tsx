import React from 'react';
import { Appearance, useColorScheme, Switch } from 'react-native';
import { View, Text } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const AppearanceCard = () => {
    const { t: translate } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const toggleTheme = () => {
        Appearance.setColorScheme(isDark ? 'light' : 'dark');
    };

    return (
        <View className="flex-row p-4 bg-background dark:bg-darkBackgroundMuted border-t border-neutral-100 dark:border-darkBorder items-center">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#14b8a6" />
            </View>
            <View className="ml-3 flex-1">
                <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                    {translate('settings.account.appearance.title')}
                </Text>
                <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
                    {isDark ? translate('settings.account.appearance.dark') : translate('settings.account.appearance.light')}
                </Text>
            </View>
            <Switch
                trackColor={{ false: '#d4d4d4', true: '#FF6600' }}
                thumbColor="#FFFFFF"
                value={isDark}
                onValueChange={toggleTheme}
            />
        </View>
    );
};
