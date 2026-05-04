import React from "react";
import { ActivityIndicator, Keyboard } from "react-native";
import { Text, TouchableOpacity } from "@/tw";
import * as LucideIcons from "lucide-react-native";
import { Image as ExpoImage, type ImageSource } from "expo-image";

type ButtonVariant = "primary" | "accent" | "success" | "danger" | "secondary" | "ghost" | "clear";
type IconName = keyof typeof LucideIcons;

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  leftImage?: ImageSource;
  leftImageSize?: number;
  fullWidth?: boolean;
  fitContent?: boolean;
  dense?: boolean;
  roundedFull?: boolean;
  loading?: boolean;
  disabled?: boolean;
  keyboardDismiss?: boolean;
  authButton?: boolean;
  elevation?: boolean;
  rightIcon?: IconName;
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
  accent: {
    container: "bg-white",
    text: "text-primary",
    iconColor: "#FF6600",
    spinnerColor: "#FF6600"
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
    text: "text-textPrimary dark:text-slate-400",
    iconColor: "#94A3B8",
    spinnerColor: "#94A3B8"
  },
  ghost: {
    container: "border border-dashed border-slate-200 dark:border-slate-700",
    text: "text-textSecondary dark:text-slate-500",
    iconColor: "#94A3B8",
    spinnerColor: "#94A3B8"
  },
  clear: {
    container: "bg-transparent border border-slate-200 dark:border-darkBorder",
    text: "text-textPrimary dark:text-darkTextPrimary",
    iconColor: "#FF6600",
    spinnerColor: "#FF6600"
  }
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  leftImage,
  leftImageSize = 18,
  fullWidth = false,
  fitContent = false,
  dense = false,
  roundedFull = false,
  loading = false,
  disabled = false,
  keyboardDismiss = false,
  authButton = false,
  elevation = false,
  rightIcon,
}: ButtonProps) {
  let { container, text, iconColor, spinnerColor } = config[variant];

  if (variant === "primary" && disabled) {
    container = container.replace("bg-primary", "bg-primary/50");
  }

  if (authButton && variant === "secondary") {
    container = "bg-transparent border border-slate-200 dark:border-slate-700";
  }

  const LucideIcon = icon ? (LucideIcons[icon] as React.ComponentType<{ size: number; color: string }>) : null;
  const RightLucideIcon = rightIcon ? (LucideIcons[rightIcon] as React.ComponentType<{ size: number; color: string }>) : null;
  const fullWidthPad = fitContent ? "px-5" : dense ? "px-4" : "px-10";
  const sizeClass = authButton
    ? fullWidth
      ? `w-full py-4 ${fullWidthPad}`
      : `w-fit py-3.5 ${fitContent ? "px-5" : "px-10"}`
    : fullWidth
      ? `w-full py-3 ${fullWidthPad}`
      : `w-fit py-2.5 ${fitContent ? "px-5" : "px-10"}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={keyboardDismiss ? () => { Keyboard.dismiss(); onPress(); } : undefined} 
      style={
        elevation ? { elevation: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 1, shadowOffset: { width: 0, height: 2 } } : { elevation: 0 }
   
      }
      className={`${sizeClass} max-w-full ${roundedFull ? "rounded-full" : "rounded-xl"} ${container} items-center flex-row justify-center gap-x-2`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {leftImage && (
            <ExpoImage
              source={leftImage}
              style={{ width: leftImageSize, height: leftImageSize }}
              contentFit="contain"
            />
          )}
          {LucideIcon && <LucideIcon size={16} color={iconColor} />}
          <Text className={`min-w-0 shrink text-sm font-poppins-semibold ${text}`} numberOfLines={1}>{label}</Text>
          {RightLucideIcon && <RightLucideIcon size={16} color={iconColor} />}
        </>
      )}
    </TouchableOpacity>
  );
}
