import React, { useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { Languages, Check, ChevronUp, ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";
import CountryFlag from 'react-native-country-flag';

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
        <View className="bg-white dark:bg-darkBackgroundCard px-2.5 py-3 overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
                    <Languages size={15} color="#FF6600" />
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
                        <View className="flex-row items-center gap-x-2">
                            <View className="w-6 h-6 rounded-full overflow-hidden items-center justify-center border border-slate-100 dark:border-neutral-700">
                                <CountryFlag isoCode="gb" size={20} />
                            </View>
                            <Text className={`text-sm font-poppins-medium ${language === 'en' ? 'text-primary' : 'text-textSecondary dark:text-darkTextSecondary'}`}>
                                English
                            </Text>
                        </View>
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
                        <View className="flex-row items-center gap-x-2">
                            <View className="w-6 h-6 rounded-full overflow-hidden items-center justify-center border border-slate-100 dark:border-neutral-700">
                                <CountryFlag isoCode="jp" size={20} />
                            </View>
                            <Text className={`text-sm font-poppins-medium ${language === 'ja' ? 'text-primary' : 'text-textSecondary dark:text-darkTextSecondary'}`}>
                                日本語
                            </Text>
                        </View>
                        {language === 'ja' && (
                            <Check size={12} color="#FF6600" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};