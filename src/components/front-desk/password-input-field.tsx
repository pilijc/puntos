import React from "react";
import { TouchableOpacity, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TextField } from "@/components/text-field";

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
    <>
      <TextField
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry && !showPassword}
        error={!!error}
        rightAccessory={
          <TouchableOpacity onPress={onTogglePassword}>
            <MaterialIcons 
              name={showPassword ? "visibility-off" : "visibility"} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        }
      />
      {error && (
        <Text className="text-xs font-poppins text-red-500 mt-1">
          {error}
        </Text>
      )}
    </>
  );
}
