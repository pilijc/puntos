import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { TYPO, COLORS, FILTER_OPTIONS } from "./constants";
import type { AccountStatusFilter } from "@/store/super-admin/user-store";

interface FilterBottomSheetProps {
  visible: boolean;
  statusFilter: AccountStatusFilter;
  onClose: () => void;
  onSelectFilter: (value: AccountStatusFilter) => void;
}

export function FilterBottomSheet({
  visible,
  statusFilter,
  onClose,
  onSelectFilter,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const closeSheet = useCallback(
    (onClosed?: () => void) => {
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
    if (visible) {
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
          className="bg-white rounded-t-3xl pt-3 px-4"
          style={{ elevation: 20, paddingBottom: insets.bottom + 20 }}
        >
          <View className="w-9 h-1 bg-slate-200 rounded-full self-center mb-4" />
          <Text className="text-[15px] font-poppins-bold text-textPrimary mb-4">
            Filter Users
          </Text>
          <View className="gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => closeSheet(() => onSelectFilter(option.value))}
                  className={`flex-row items-center px-3 py-2.5 rounded-xl border ${
                    isActive ? "bg-primary/5 border-primary/30" : "bg-backgroundMuted border-slate-100"
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-[12px] ${
                        isActive ? "font-poppins-bold text-primary" : "font-poppins-medium text-textSecondary"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className={TYPO.subtitle}>{option.desc}</Text>
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
