import React from "react";
import { Appearance, useColorScheme } from "react-native";
import { TouchableOpacity } from "@/tw";
import { Ionicons } from "@expo/vector-icons";

interface DarkModeToggleProps {
    /** Extra Tailwind/NativeWind class names forwarded to the outer TouchableOpacity */
    className?: string;
    /** Icon size in pixels (default 20) */
    iconSize?: number;
    /** Set to true when the button sits on the primary (orange) header so it uses white tones */
    onPrimary?: boolean;
}

/**
 * A reusable dark-mode toggle button.
 *
 * Drop this anywhere you need a moon/sun icon that flips the global
 * colour scheme.  No props are required – it reads the current scheme
 * itself via `useColorScheme()`.
 *
 * @example
 * // Basic usage
 * <DarkModeToggle />
 *
 * @example
 * // Custom size + extra styling
 * <DarkModeToggle iconSize={24} className="mr-2" />
 */
export default function DarkModeToggle({
    className = "",
    iconSize = 20,
    onPrimary = false,
}: DarkModeToggleProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const toggleTheme = () => {
        Appearance.setColorScheme(isDark ? "light" : "dark");
    };

    const iconColor = onPrimary ? "#FFFFFF" : (isDark ? "#fcd34d" : "#f59e0b");
    const baseClass = onPrimary
        ? "h-10 w-10 bg-white/20 rounded-full items-center justify-center border border-white/30 active:bg-white/30"
        : "h-10 w-10 bg-white dark:bg-darkBackgroundMuted rounded-full items-center justify-center border border-neutral-200 dark:border-darkBorder active:bg-neutral-50 dark:active:bg-darkBackgroundCard";

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            className={`${baseClass} ${className}`}
            accessibilityRole="button"
            accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={iconSize}
                color={iconColor}
            />
        </TouchableOpacity>
    );
}
