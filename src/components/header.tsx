import React from "react";
import { useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronLeft } from "lucide-react-native";

type AppHeaderProps = {
  title: string;
  description?: string;
  onBackPress: () => void;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  paddingTop?: number;
  className?: string;
};

export function AppHeader({
  title,
  description,
  onBackPress,
  rightIcon,
  onRightIconPress,
  paddingTop = 0,
  className = "bg-white dark:bg-darkBackground ",
}: AppHeaderProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <View className={`px-2 py-2 ${className}`}>
      <View className="flex-row items-center mb-1">
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center -mt-0.5"
          activeOpacity={0.7}
          onPress={onBackPress}
        >
          <ChevronLeft size={20} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>

        <View className="flex-1 px-2 py-1">
          <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary text-center">
            {title}
          </Text>
          {description ? (
            <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted text-center -mt-0.5">
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