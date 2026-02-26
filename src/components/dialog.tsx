import React from "react";
import { Modal, Pressable, View } from "react-native";
import { Text, TouchableOpacity } from "@/tw";

type DialogVariant = "default" | "success" | "danger" | "warning";

type DialogProps = {
  visible: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
};

export function Dialog({
  visible,
  title,
  message,
  variant = "default",
  confirmText,
  cancelText = "Close",
  onConfirm,
  onCancel,
  onClose,
}: DialogProps) {
  const variantStyles = {
    default: "bg-primary",
    success: "bg-green-600",
    danger: "bg-red-600",
    warning: "bg-yellow-500",
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        className="absolute inset-0 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-2xl p-6 w-full max-w-[340px] mx-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <Text className="text-lg font-poppins-bold text-neutral-900 text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-sm font-poppins text-neutral-600 text-center mb-6">
            {message}
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            {confirmText && onConfirm ? (
              <>
                <TouchableOpacity
                  onPress={onCancel ?? onClose}
                  className="flex-1 py-3 rounded-xl border border-neutral-300 items-center"
                >
                  <Text className="text-sm font-poppins text-neutral-700">
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onConfirm}
                  className={`flex-1 py-3 rounded-xl items-center ${variantStyles[variant]}`}
                >
                  <Text className="text-sm font-poppins-bold text-white">
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                className={`w-full py-3 rounded-xl items-center ${variantStyles[variant]}`}
              >
                <Text className="text-sm font-poppins-bold text-white">
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}