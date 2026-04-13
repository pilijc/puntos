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
  multiline?: boolean;
  numberOfLines?: number;
  sanitize?: (value: string) => string;
  rightAccessory?: React.ReactNode;
  secureTextEntry?: boolean;
  editable?: boolean;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboardType = "default",
  required = false,
  multiline = false,
  numberOfLines,
  sanitize = (v) => v.replace(/-/g, ""),
  rightAccessory,
  secureTextEntry = false,
  editable = true,
}: TextFieldProps) {
  const hasRight = !!rightAccessory;

  return (
    <View className="gap-y-1.5">
      <Text className="text-sm font-poppins text-slate-700 dark:text-slate-300">
        {label} {required && <Text className="text-sm font-poppins text-red-500 dark:text-red-400 -mt-1">*</Text>}
      </Text>
      {hint && (
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 -mt-1">
          {hint}
        </Text>
      )}
      <View className="relative justify-center">
        <TextInput
          className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-base font-poppins text-slate-900 dark:text-slate-100 ${hasRight ? "pr-11" : "pr-4"
            }`}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={{
            height: multiline ? 96 : 45,
            lineHeight: 20,
            paddingVertical: 0,
            paddingHorizontal: 12,
            textAlignVertical: multiline ? "top" : "center",
            includeFontPadding: false,
            paddingTop: multiline ? 12 : 0,
            fontSize: 13,
          }}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          value={value}
          onChangeText={(v) => onChangeText(sanitize(v))}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
        {hasRight ? (
          <View
            pointerEvents="box-none"
            className="absolute right-1 top-0 bottom-0 justify-center items-center"
          >
            {rightAccessory}
          </View>
        ) : null}
      </View>
    </View>
  );
}
