import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  Pressable,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { TYPO, COLORS, FILTER_OPTIONS } from "@/type/super-admin/user";
import type { AccountStatusFilter } from "@/store/super-admin/user-store";
import { useIsDark } from "@/hooks/use-is-dark";

interface FilterBottomSheetProps {
  visible: boolean;
  statusFilter: AccountStatusFilter;
  onClose: () => void;
  onSelectFilter: (value: AccountStatusFilter) => void;
}

const isWeb = Platform.OS === "web";

export function FilterBottomSheet({
  visible,
  statusFilter,
  onClose,
  onSelectFilter,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const closeSheet = useCallback(
    (onClosed?: () => void) => {
      if (isWeb) {
        onClose();
        onClosed?.();
        return;
      }
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        requestAnimationFrame(() => {
          onClose();
          onClosed?.();
        });
      });
    },
    [translateY, backdropOpacity, onClose]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50) closeSheet();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible && !isWeb) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // ── Web: right-aligned dropdown below the Filter button ──
  if (isWeb) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        pointerEvents="box-none"
      >
        {/* Invisible backdrop to close on outside click */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => onClose()}
        />

        {/* Wrapper to match ScrollView padding */}
        <View
          style={{ width: "100%", height: "100%", paddingHorizontal: 16 }}
          pointerEvents="box-none"
        >
          {/* Centered container to align with content width (896px) */}
          <View 
            style={{ width: "100%", maxWidth: 896, height: "100%", alignSelf: "center", position: "relative" }} 
            pointerEvents="box-none"
          >
            {/* Dropdown panel anchored to the filter button on the right section */}
            <View
              style={{
                position: "absolute",
                top: 130,
                right: 0,    // Aligns with the right-aligned filter button in 896px layout
              width: 280,
              backgroundColor: isDark ? "#262626" : "#ffffff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? "#404040" : "#e2e8f0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 20,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#404040" : "#f1f5f9",
              }}
            >
              <Text
                style={{ fontSize: 13, fontFamily: "Poppins-SemiBold", color: isDark ? "#f8fafc" : "#0f172a" }}
              >
                Filter Users
              </Text>
              <Pressable onPress={() => onClose()} style={{ padding: 4 }}>
                <Feather name="x" size={15} color={isDark ? "#737373" : "#94a3b8"} />
              </Pressable>
            </View>

            {/* Options */}
            <View style={{ padding: 12, gap: 6 }}>
            {FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelectFilter(option.value);
                    onClose();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isActive ? (isDark ? "#7c2d12" : "#fed7aa") : (isDark ? "#525252" : "#f1f5f9"),
                    backgroundColor: isActive ? (isDark ? "#431407" : "#fff7ed") : (isDark ? "#404040" : "#f8fafc"),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: isActive ? "Poppins-SemiBold" : "Poppins-Medium",
                        color: isActive ? COLORS.primary : (isDark ? "#e2e8f0" : "#334155"),
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{ fontSize: 10, fontFamily: "Poppins-Regular", color: isDark ? "#737373" : "#94a3b8", marginTop: 1 }}
                    >
                      {option.desc}
                    </Text>
                  </View>
                  {isActive && (
                    <Feather name="check" size={14} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Reset */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? "#404040" : "#f1f5f9",
              paddingTop: 8,
            }}
          >
            <Pressable
              onPress={() => {
                onSelectFilter("All");
                onClose();
              }}
              style={{
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: isDark ? "#404040" : "#f1f5f9",
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: isDark ? "#a3a3a3" : "#64748b" }}>
                Reset filter
              </Text>
            </Pressable>
          </View>
          </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile: original bottom sheet (unchanged) ──
  return (
    <View
      className="absolute inset-0 z-50"
      style={{ justifyContent: "flex-end" }}
      pointerEvents="box-none"
      collapsable={false}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
        className="bg-slate-900/50"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => closeSheet()}
        />
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY }] }}>
        <View
          {...panResponder.panHandlers}
          className="bg-white dark:bg-darkBackgroundMuted rounded-t-3xl pt-3 px-4"
          style={{ elevation: 20, paddingBottom: insets.bottom + 20 }}
        >
          <View className="w-9 h-1 bg-slate-200 dark:bg-darkBorder rounded-full self-center mb-4" />
          <Text className="text-[15px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary mb-4">
            Filter Users
          </Text>
          <View className="gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => closeSheet(() => onSelectFilter(option.value))}
                  className={`flex-row items-center px-3 py-2.5 rounded-xl border ${isActive ? "bg-primary/5 border-primary/30" : "bg-backgroundMuted dark:bg-darkBackgroundCard border-slate-100 dark:border-darkBorder"
                    }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-[12px] ${isActive ? "font-poppins-bold text-primary" : "font-poppins-medium text-textSecondary dark:text-darkTextSecondary"
                        }`}
                    >
                      {option.label}
                    </Text>
                    <Text className={`${TYPO.subtitle} dark:text-darkTextMuted`}>{option.desc}</Text>
                  </View>
                  {isActive && (
                    <Feather name="check" size={14} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="mt-4">
            <Button
              label="Reset filter"
              onPress={() => closeSheet(() => onSelectFilter("All"))}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
