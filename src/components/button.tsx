import React from "react";
import { ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type ButtonVariant = "primary" | "success" | "danger" | "secondary" | "ghost";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
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
    container: "border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
    text: "text-red-500",
    iconColor: "#EF4444",
    spinnerColor: "#EF4444"
  },
  secondary: {
    container: "border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900",
    text: "text-slate-500 dark:text-slate-400",
    iconColor: "#94A3B8",
    spinnerColor: "#94A3B8"
  },
  ghost: {
    container: "border-2 border-dashed border-slate-200 dark:border-slate-700",
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
}: ButtonProps) {
  const { container, text, iconColor, spinnerColor } = config[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      className={`${fullWidth ? "w-full" : "w-fit"} rounded-xl ${container} py-3 px-6 items-center flex-row justify-center gap-x-2`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && <MaterialIcons name={icon} size={16} color={iconColor} />}
          <Text className={`text-sm font-poppins-semibold ${text}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
