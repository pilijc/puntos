import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";

interface StoreHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  variant?: "default" | "circular";
  containerClassName?: string;
  showBackButton?: boolean;
}

export default function StoreHeader({
  title,
  subtitle,
  onBack,
  variant = "default",
  containerClassName = "",
  showBackButton = true,
}: StoreHeaderProps) {
  const router = useRouter();

  if (variant === "circular") {
    return (
      <View className={`flex-row items-center ${containerClassName}`.trim()}>
        {showBackButton && (
          <TouchableOpacity
            onPress={onBack || (() => router.back())}
            activeOpacity={0.7}
            className="-ml-3 mr-1"
          >
            <MaterialIcons name="chevron-left" size={36} color="#FF6600" />
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-neutral-500 font-poppins mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-row items-center mb-2 mt-4 ${containerClassName}`.trim()}>
      {showBackButton && (
        <TouchableOpacity
          onPress={onBack || (() => router.back())}
          activeOpacity={0.7}
          className="-ml-3 mr-1"
        >
          <MaterialIcons name="chevron-left" size={36} color="#FF6600" />
        </TouchableOpacity>
      )}
      <View>
        <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-neutral-500 font-poppins mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
