import React from "react";
import { ActivityIndicator, Keyboard } from "react-native";
import { Text, TouchableOpacity } from "@/tw";
import * as LucideIcons from "lucide-react-native";

type ButtonVariant = "primary" | "success" | "danger" | "secondary" | "ghost";
type IconName = keyof typeof LucideIcons;

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  keyboardDismiss?: boolean;
}

const config: Record<
  ButtonVariant,
  {
    container: string;
    text: string;
    iconColor: string;
    spinnerColor: string;
  }
> = {
  primary: {
    container: "bg-primary",
    text: "text-white",
    iconColor: "#fff",
    spinnerColor: "#fff"
  },
  success: {
    container: "bg-emerald-500",
    text: "text-white",
    iconColor: "#fff",
    spinnerColor: "#fff"
  },
  danger: {
    container: "bg-red-100 dark:bg-red-800/20",
    text: "text-red-500",
    iconColor: "#EF4444",
    spinnerColor: "#EF4444"
  },
  secondary: {
    container: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    iconColor: "#94A3B8",
    spinnerColor: "#94A3B8"
  },
  ghost: {
    container: "border border-dashed border-slate-200 dark:border-slate-700",
    text: "text-slate-400 dark:text-slate-500",
    iconColor: "#94A3B8",
    spinnerColor: "#94A3B8"
  }
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  fullWidth = false,
  loading = false,
  disabled = false,
  keyboardDismiss = false,
}: ButtonProps) {
  let { container, text, iconColor, spinnerColor } = config[variant];

  if (variant === "primary" && disabled) {
    container = container.replace("bg-primary", "bg-primary/50");
  }

  const LucideIcon = icon ? (LucideIcons[icon] as React.ComponentType<{ size: number; color: string }>) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={keyboardDismiss ? () => { Keyboard.dismiss(); onPress(); } : undefined}
      className={`${fullWidth ? "w-full py-3 px-10" : "w-fit py-2.5 px-10"} rounded-xl ${container} items-center flex-row justify-center gap-x-2`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {LucideIcon && <LucideIcon size={16} color={iconColor} />}
          <Text className={`text-sm font-poppins-semibold ${text}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
