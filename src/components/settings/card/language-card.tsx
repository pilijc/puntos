import React, { useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { View, Text, TouchableOpacity } from "@/tw";
import { Languages, Check, ChevronUp, ChevronDown } from "lucide-react-native";
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
        <View className="bg-background dark:bg-darkBackgroundMuted p-4 border-t border-border dark:border-darkBorder overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center">
                    <Languages size={15} color="#2563eb" />
                </View>

                <View className="flex-1 ml-3">
                    <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.account.language.title')}
                    </Text>
                    <Text className="text-xs font-poppins-regular text-textMuted dark:text-darkTextMuted">
                        {language === 'ja' ? "日本語" : "English"}
                    </Text>
                </View>

                {isOpen ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
            </TouchableOpacity>

            {isOpen && (
                <View className="mt-2">
                    {/* divider */}
                    <View className="h-[1px] bg-border dark:bg-darkBorder mb-1 ml-12" />

                    {/* english */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('en')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'en' ? 'text-primary' : 'text-textPrimary dark:text-darkTextSecondary'}`}>
                            English
                        </Text>
                        {language === 'en' && (
                            <Check size={18} color="#FF6600" />
                        )}
                    </TouchableOpacity>

                    {/* divider */}
                    <View className="h-[1px] bg-border dark:bg-darkBorder ml-12" />

                    {/* japanese */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('ja')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'ja' ? 'text-primary' : 'text-textPrimary dark:text-darkTextSecondary'}`}>
                            日本語
                        </Text>
                        {language === 'ja' && (
                            <Check size={18} color="#FF6600" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};