import React, { useState } from 'react';
import { LayoutAnimation } from 'react-native';
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
        <View className="bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
                    <Languages size={15} color="#0f172a" />
                </View>

                <View className="flex-1 ml-2">
                    <Text className="text-md font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {translate('settings.account.language.title')}
                    </Text>
                    <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                        {language === 'ja' ? "日本語" : "English"}
                    </Text>
                </View>

                {isOpen ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
            </TouchableOpacity>

            {isOpen && (
                <View className="mt-3">
                    {/* english */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('en')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'en' ? 'text-primary' : 'text-textSecondary dark:text-darkTextSecondary'}`}>
                            English
                        </Text>
                        {language === 'en' && (
                            <Check size={12} color="#FF6600" />
                        )}
                    </TouchableOpacity>

                    {/* japanese */}
                    <TouchableOpacity
                        onPress={() => handleSelectLanguage('ja')}
                        className="flex-row items-center justify-between py-3 ml-12"
                        activeOpacity={0.6}
                    >
                        <Text className={`text-sm font-poppins-medium ${language === 'ja' ? 'text-primary' : 'text-textSecondary dark:text-darkTextSecondary'}`}>
                            日本語
                        </Text>
                        {language === 'ja' && (
                            <Check size={12} color="#FF6600" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};