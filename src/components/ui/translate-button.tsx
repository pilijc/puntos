import React, { useRef, useState } from "react";
import { Modal, useColorScheme, useWindowDimensions, Platform, StatusBar } from "react-native";
import { View, Text, TouchableOpacity, Pressable } from "@/tw";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";
import CountryFlag from "react-native-country-flag";

const LANGUAGES = [
    { code: "en" as const, isoCode: "gb", label: "English", short: "EN" },
    { code: "ja" as const, isoCode: "jp", label: "日本語",  short: "JP" },
] as const;

export default function TranslateButton() {
    const { i18n } = useTranslation();
    const { setLanguage } = useLanguageStore();
    const [open, setOpen] = useState(false);
    const isDark = useColorScheme() === "dark";
    const { width: windowWidth } = useWindowDimensions();

    const [dropdownPos, setDropdownPos] = useState({ top: 100, right: 24 });
    const buttonRef = useRef<any>(null);

    const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

    const selectLanguage = (lang: "en" | "ja") => {
        setLanguage(lang);
        setOpen(false);
    };

    const isWeb = Platform.OS === "web";

    const openDropdown = () => {
        if (isWeb) {
            setOpen(true);
            return;
        }

        if (buttonRef.current?.measure) {
            buttonRef.current.measure((x: number, y: number, w: number, h: number, pageX: number, pageY: number) => {
                // Uniform 12px gap for mobile
                setDropdownPos({ top: pageY + h + 12, right: windowWidth - (pageX + w) });
                setOpen(true);
            });
        } else {
            setOpen(true);
        }
    };

    const dropdownContent = (
        <View
            className="absolute"
            style={isWeb ? {
                top: "100%",
                right: 0,
                marginTop: 12, // Increased gap for web to match mobile
                minWidth: 160,
                zIndex: 50,
            } : {
                top: dropdownPos.top,
                right: dropdownPos.right,
                minWidth: 160,
            }}
        >
            <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-200 dark:border-slate-700 rounded-xl py-2 w-full">
                {LANGUAGES.map((lang, index) => (
                    <React.Fragment key={lang.code}>
                        {index > 0 && (
                            <View className="h-px bg-slate-200 dark:bg-slate-700 mx-3" />
                        )}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => selectLanguage(lang.code)}
                            className="flex-row items-center px-4 py-3"
                            style={{ gap: 10 }}
                        >
                            <View className="w-6 h-4 rounded-sm overflow-hidden items-center justify-center">
                                <CountryFlag isoCode={lang.isoCode} size={18} />
                            </View>
                            <Text className="text-sm font-poppins-semibold text-slate-500 dark:text-slate-400 flex-1">
                                {lang.label}
                            </Text>
                            {current.code === lang.code && (
                                <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </TouchableOpacity>
                    </React.Fragment>
                ))}
            </View>
            {/* Little top popover arrow pointing to the button, rendered after so it covers the container border */}
            <View 
                className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-darkBackgroundMuted border-t border-l border-slate-200 dark:border-slate-700" 
                style={{ transform: [{ rotate: "45deg" }] }} 
            />
        </View>
    );

    return (
        <View style={isWeb ? { zIndex: 50, position: "relative" } : undefined}>
            {/* ── Trigger pill ──────────────────────────────────── */}
            <TouchableOpacity
                ref={buttonRef}
                onPress={openDropdown}
                activeOpacity={0.75}
                className="w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-darkBackgroundMuted border border-slate-200 dark:border-slate-700"
            >
                <View className="w-6 h-6 rounded-full overflow-hidden items-center justify-center">
                    <CountryFlag isoCode={current.isoCode} size={24} />
                </View>
            </TouchableOpacity>

            {/* ── Dropdown ──────────────────────────────────────── */}
            {open && isWeb && (
                <>
                    <Pressable 
                        style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} 
                        onPress={() => setOpen(false)} 
                    />
                    {dropdownContent}
                </>
            )}

            {open && !isWeb && (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <Pressable className="flex-1" onPress={() => setOpen(false)}>
                        {dropdownContent}
                    </Pressable>
                </Modal>
            )}
        </View>
    );
}
