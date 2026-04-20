import React, { useState } from "react";
import { TouchableOpacity, Modal, Pressable, useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TranslateButton() {
    const { i18n } = useTranslation();
    const { setLanguage } = useLanguageStore();
    const [open, setOpen] = useState(false);
    const isDark = useColorScheme() === "dark";
    const insets = useSafeAreaInsets();

    const isEn = i18n.language === "en";

    const selectLanguage = (lang: "en" | "ja") => {
        setLanguage(lang);
        setOpen(false);
    };

    const topOffset = insets.top > 0 ? insets.top + 96 : 100;

    return (
        <>
            <TouchableOpacity
                onPress={() => setOpen(true)}
                className="w-10 h-10 rounded-full items-center justify-center bg-neutral-100 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder"
                activeOpacity={0.7}
            >
                <Text className="text-[22px] leading-none">
                    {isEn ? "🇺🇸" : "🇯🇵"}
                </Text>
            </TouchableOpacity>

            <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
                    <View
                        style={{
                            position: "absolute",
                            top: topOffset,
                            right: 24,
                            backgroundColor: isDark ? "#1c1c1e" : "#fff",
                            borderRadius: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.1,
                            shadowRadius: 16,
                            elevation: 8,
                            minWidth: 140,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: isDark ? "#2a2a2a" : "#f1f5f9"
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => selectLanguage("en")}
                            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 }}
                        >
                            <Text className="text-[22px] leading-none">🇺🇸</Text>
                            <Text className={`text-xs font-poppins-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                English
                            </Text>
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: isDark ? "#2a2a2a" : "#F1F5F9", marginHorizontal: 14 }} />

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => selectLanguage("ja")}
                            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 }}
                        >
                            <Text className="text-[22px] leading-none">🇯🇵</Text>
                            <Text className={`text-xs font-poppins-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                日本語
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
