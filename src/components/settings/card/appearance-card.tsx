import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from "@/tw";
import { useTranslation } from 'react-i18next';
import { useAppearanceStore } from '@/store/appearance-store';
import { LayoutAnimation } from 'react-native';
import { SunMoon, ChevronUp, ChevronDown, Check } from 'lucide-react-native';

export const AppearanceCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t: translate } = useTranslation();
    const { theme, setTheme } = useAppearanceStore();
    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(prev => !prev);
    }

    return (
        <View className="bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 items-center justify-center">
                    <SunMoon size={15} color="#14b8a6" />
                </View>

                <View className="flex-1 ml-3">
                    <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.account.appearance.title')}
                    </Text>
                    <Text className="text-xs font-poppins-regular text-textMuted dark:text-darkTextMuted">
                        {
                            theme === 'system' ? translate("settings.account.appearance.system") :
                                theme === 'dark' ? translate("settings.account.appearance.dark") :
                                    translate("settings.account.appearance.light")
                        }
                    </Text>
                </View>

                {isOpen ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
            </TouchableOpacity>

            {isOpen && (
                <View className="mt-3">
                    {/* divider */}
                    <View className="h-[1px] bg-border dark:bg-darkBorder" />

                    {/* light */}
                    <TouchableOpacity
                        onPress={() => setTheme('light')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${theme === 'light' ? 'text-primary' : 'text-textPrimary dark:text-darkTextSecondary'}`}>
                            {translate('settings.account.appearance.light')}
                        </Text>

                        {theme === 'light' && <Check size={12} color="#ff6600" />}
                    </TouchableOpacity>

                    {/* divider */}
                    <View className="h-[1px] bg-border dark:bg-darkBorder opacity-25 ml-12" />

                    {/* dark */}
                    <TouchableOpacity
                        onPress={() => setTheme('dark')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${theme === 'dark' ? 'text-primary' : 'text-textPrimary dark:text-darkTextSecondary'}`}>
                            {translate('settings.account.appearance.dark')}
                        </Text>
                        {theme === 'dark' && <Check size={12} color="#ff6600" />}
                    </TouchableOpacity>

                    {/* divider */}
                    <View className="h-[1px] bg-border dark:bg-darkBorder opacity-25 ml-12" />

                    {/* system */}
                    <TouchableOpacity
                        onPress={() => setTheme('system')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${theme === 'system' ? 'text-primary' : 'text-textPrimary dark:text-darkTextSecondary'}`}>
                            {translate('settings.account.appearance.system')}
                        </Text>
                        {theme === 'system' && <Check size={12} color="#ff6600" />}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
