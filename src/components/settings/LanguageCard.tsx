import React, { useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";

export const LanguageCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t: translate } = useTranslation();
    const language = useLanguageStore((s) => s.language);
    const setLanguage = useLanguageStore((s) => s.setLanguage);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(prev => !prev);
    };

    const handleSelectLanguage = (lang: 'en' | 'ja') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <View className="bg-background dark:bg-darkBackgroundMuted p-3 border-t border-neutral-200 dark:border-darkBorder overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center">
                    <Ionicons name="language-outline" size={15} color="#2563eb" />
                </View>

                <View className="flex-1 ml-3">
                    <Text className="text-base font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary">
                        {translate('settings.account.language.title')}
                    </Text>
                    <Text className="text-xs font-poppins-regular text-neutral-400 dark:text-darkTextMuted">
                        {language === 'ja' ? translate('settings.account.language.jp') : translate('settings.account.language.en')}
                    </Text>
                </View>

                <Ionicons
                    name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={20}
                    color="#94a3b8"
                />
            </TouchableOpacity>

            {isOpen && (
                <View className="mt-2">
                    {/* Divider */}
                    <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder mb-1 ml-12" />

                    {/* English Row */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('en')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'en' ? 'text-primary' : 'text-neutral-600 dark:text-darkTextSecondary'}`}>
                            {translate('settings.account.language.en')}
                        </Text>
                        {language === 'en' && (
                            <Ionicons name="checkmark" size={18} color="#FF6600" />
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder ml-12" />

                    {/* Japanese Row */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('ja')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'ja' ? 'text-primary' : 'text-neutral-600 dark:text-darkTextSecondary'}`}>
                            {translate('settings.account.language.jp')}
                        </Text>
                        {language === 'ja' && (
                            <Ionicons name="checkmark" size={18} color="#FF6600" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};