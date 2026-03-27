import React from "react";
import { TouchableOpacity } from "@/tw";
import { Text } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";

export default function TranslateButton() {
    const { i18n } = useTranslation();
    const { setLanguage } = useLanguageStore();

    const toggleLanguage = () => {
        const newLang = i18n.language === "en" ? "ja" : "en";
        setLanguage(newLang);
    };

    return (
        <TouchableOpacity
            onPress={toggleLanguage}
            className="flex-row items-center bg-neutral-100 dark:bg-darkBackgroundMuted px-3 py-1.5 rounded-full border border-neutral-200 dark:border-darkBorder"
            activeOpacity={0.7}
        >
            <Ionicons
                name="globe-outline"
                size={16}
                color={i18n.language === "en" ? "#6b7280" : "#FF6600"}
            />
            <Text className="ml-1.5 text-xs font-poppins-semibold text-neutral-600 dark:text-darkTextSecondary uppercase">
                {i18n.language === "en" ? "JP" : "EN"}
            </Text>
        </TouchableOpacity>
    );
}
