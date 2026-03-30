import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md";
}

export function Toggle({ value, onValueChange, disabled = false, size = "md" }: ToggleProps) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  const trackW  = size === "xs" ? 31 : size === "sm" ? 36 : 44;
  const trackH  = size === "xs" ? 19 : size === "sm" ? 22 : 26;
  const thumbSz = size === "xs" ? 14 : size === "sm" ? 16 : 20;
  const travel  = trackW - thumbSz - 5;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? travel : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  }, [value, travel]);

  const bgColor = translateX.interpolate({
    inputRange: [0, travel],
    outputRange: ["#D1D5DB", "#FF6600"],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={{
          width: trackW,
          height: trackH,
          borderRadius: trackH / 2,
          backgroundColor: bgColor,
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <Animated.View
          style={{
            width: thumbSz,
            height: thumbSz,
            borderRadius: thumbSz / 2,
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 2,
            elevation: 2,
            transform: [{ translateX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
