import React from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppearanceStore, ThemeType } from '@/store/appearance-store';

export const AppearanceCard = () => {
    const { t: translate } = useTranslation();
    const { theme, setTheme } = useAppearanceStore();
    const renderOptionBox = (value: ThemeType, iconName: any, label: string) => {
        const isSelected = theme === value;
        return (
            <TouchableOpacity
                onPress={() => setTheme(value)}
                className={`flex-1 py-3 items-center justify-center rounded-xl border ${isSelected ? 'bg-primary/10 border-primary' : 'bg-transparent border-neutral-200 dark:border-darkBorder'}`}>
                <Ionicons
                    name={iconName}
                    size={20}
                    color={isSelected ? "#FF6600" : "#9CA3AF"}
                />
                <Text className={`text-xs mt-1.5 font-poppins-semibold ${isSelected ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className="p-4 bg-background dark:bg-darkBackgroundMuted border-t border-neutral-200 dark:border-darkBorder">
            <View className="flex-row items-center mb-4">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                    <Ionicons name="color-palette" size={18} color="#14b8a6" />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                        {translate('settings.account.appearance.title', { defaultValue: 'Appearance' })}
                    </Text>
                    <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
                        {translate("settings.account.appearance.description")}
                    </Text>
                </View>
            </View>
            <View className="flex-row items-center gap-x-2">
                {renderOptionBox('light', 'sunny', translate("settings.account.appearance.light"))}
                {renderOptionBox('dark', 'moon', translate("settings.account.appearance.dark"))}
                {renderOptionBox('system', 'settings-outline', translate("settings.account.appearance.system"))}
            </View>

        </View>
    );
};
