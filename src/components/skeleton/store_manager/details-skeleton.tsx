import React, { useEffect, useRef } from "react";
import { Animated, useColorScheme, useWindowDimensions } from "react-native";
import { View } from "@/tw";

export function DetailsSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: screenWidth } = useWindowDimensions();

  const bg = isDark ? "#2a2a2a" : "#E2E8F0";
  const divBg = isDark ? "#262626" : "#F1F5F9";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 48,
        gap: 16,
      }}
    >
      <View
        style={{
          backgroundColor: isDark ? "#1c1c1c" : "#fff",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: divBg,
          overflow: "hidden",
        }}
      >
        {/* Logo + name + status */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
          <Animated.View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: bg, opacity }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Animated.View style={{ width: "70%", height: 14, borderRadius: 6, backgroundColor: bg, opacity }} />
            <Animated.View style={{ width: "45%", height: 11, borderRadius: 5, backgroundColor: bg, opacity }} />
            <Animated.View style={{ width: "35%", height: 11, borderRadius: 5, backgroundColor: bg, opacity }} />
          </View>
          <Animated.View style={{ width: 64, height: 22, borderRadius: 99, backgroundColor: bg, opacity }} />
        </View>

        {/* Divider */}
        <View style={{ height: 1, marginHorizontal: 16, backgroundColor: divBg }} />

        {/* Phone + registration row */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 16 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Animated.View style={{ width: "40%", height: 9, borderRadius: 4, backgroundColor: bg, opacity }} />
            <Animated.View style={{ width: "80%", height: 13, borderRadius: 5, backgroundColor: bg, opacity }} />
          </View>
          <View style={{ width: 1, backgroundColor: divBg }} />
          <View style={{ flex: 1, gap: 5 }}>
            <Animated.View style={{ width: "55%", height: 9, borderRadius: 4, backgroundColor: bg, opacity }} />
            <Animated.View style={{ width: "90%", height: 13, borderRadius: 5, backgroundColor: bg, opacity }} />
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, marginHorizontal: 16, backgroundColor: divBg }} />

        {/* Photos */}
        <View style={{ flexDirection: "row", gap: 8, padding: 16 }}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={{ flex: 1, height: 80, borderRadius: 10, backgroundColor: bg, opacity }} />
          ))}
        </View>

        {/* Divider */}
        <View style={{ height: 1, marginHorizontal: 16, backgroundColor: divBg }} />

        {/* Location */}
        <View style={{ padding: 16, gap: 10 }}>
          <Animated.View style={{ width: "25%", height: 9, borderRadius: 4, backgroundColor: bg, opacity }} />
          <Animated.View style={{ width: "75%", height: 12, borderRadius: 5, backgroundColor: bg, opacity }} />
          <Animated.View style={{ width: screenWidth - 64, height: 180, borderRadius: 10, backgroundColor: bg, opacity }} />
        </View>
      </View>
    </View>
  );
}
