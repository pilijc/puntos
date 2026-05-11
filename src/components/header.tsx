import React from "react";
import { useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronLeft } from "lucide-react-native";
import { Platform } from "react-native";

type AppHeaderProps = {
  title: string;
  description?: string;
  onBackPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  paddingTop?: number;
  className?: string;
  textAlign?: "left" | "center" | "right";
  titleSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  fullLeft?: boolean;
};

export function AppHeader({
  title,
  description,
  onBackPress,
  rightIcon,
  onRightIconPress,
  paddingTop = 0,
  className = "bg-white dark:bg-darkBackground ",
  textAlign = "center",
  titleSize = "base",
  fullLeft = false,
}: AppHeaderProps) {
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";

  return (
    <View className={`${fullLeft ? "pl-1 pr-2" : "px-2"} py-2 ${className}`}>
      <View className="flex-row items-center mb-1">
        {!fullLeft && (onBackPress ? (
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center -mt-0.5"
            activeOpacity={0.7}
            onPress={onBackPress}
          >
            <ChevronLeft size={20} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" />
        ))}

        <View className={`${fullLeft ? "flex-1" : "flex-1 px-2 py-1"}`}>
          <Text className={`text-${titleSize} font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-${textAlign}`}>
            {title}
          </Text>
          {description ? (
            <Text className={`text-xs font-poppins text-textMuted dark:text-darkTextMuted text-${textAlign} -mt-0.5`}>
              {description}
            </Text>
          ) : null}
        </View>

        <View className="min-w-10 max-w-[140px] shrink-0 items-center justify-end pl-1">
          {rightIcon ? (
            onRightIconPress ? (
              <TouchableOpacity
                className="items-center justify-center"
                activeOpacity={0.7}
                onPress={onRightIconPress}
              >
                {rightIcon}
              </TouchableOpacity>
            ) : (
              rightIcon
            )
          ) : null}
        </View>
      </View>
    </View>
  );
}