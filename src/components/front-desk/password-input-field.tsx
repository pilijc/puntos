import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface PasswordInputFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  error?: string;
  secureTextEntry?: boolean;
}

export default function PasswordInputField({
  label,
  value,
  onChangeText,
  placeholder,
  showPassword,
  onTogglePassword,
  error,
  secureTextEntry = true
}: PasswordInputFieldProps) {
  return (
    <View>
      <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-darkTextSoft mb-2">
        {label}
      </Text>
      <View className="relative">
        <TextInput
          className={`w-full bg-white dark:bg-darkBackgroundCard border ${
            error 
              ? 'border-red-300 dark:border-red-500' 
              : 'border-neutral-200 dark:border-darkBorder'
          } rounded-xl px-4 py-3.5 pr-12 text-base font-poppins text-neutral-900 dark:text-darkTextPrimary`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !showPassword}
        />
        <TouchableOpacity
          className="absolute right-3 top-3.5"
          onPress={onTogglePassword}
        >
          <MaterialIcons 
            name={showPassword ? "visibility-off" : "visibility"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text className="text-xs font-poppins text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
