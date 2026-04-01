import React from "react";
import { KeyboardTypeOptions } from "react-native";
import { View, Text, TextInput } from "@/tw";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  required?: boolean;
  secureTextEntry?: boolean;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboardType = "default",
  required = false,
  secureTextEntry = false,
}: TextFieldProps) {
  return (
    <View className="gap-y-2">
      <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <Text className="text-sm font-poppins text-red-500 dark:text-red-400 -mt-1">*</Text>}
      </Text>
      {hint && (
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 -mt-1">
          {hint}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/-/g, ""))}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
}
