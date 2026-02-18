import { TouchableOpacity, Text, View } from "@/tw";
import React from "react";

type SortPillProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export default function SortPill({
  label,
  active,
  onPress,
  leftIcon,
  rightIcon,
}: SortPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1 rounded-full ${
        active ? "bg-primary/10" : "bg-neutral-100"
      }`}
    >
      <View className="flex-row items-center gap-x-1">
        {leftIcon ? <View className="items-center">{leftIcon}</View> : null}
        <Text
          className={`text-[11px] font-poppins-semibold ${
            active ? "text-primary" : "text-neutral-500"
          }`}
        >
          {label}
        </Text>
        {rightIcon ? <View className="items-center">{rightIcon}</View> : null}
      </View>
    </TouchableOpacity>
  );
}
