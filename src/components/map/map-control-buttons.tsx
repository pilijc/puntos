import React from "react";
import { View, TouchableOpacity } from "@/tw";
import { useColorScheme } from "react-native";
import { Compass, LocateFixed, Navigation2 } from "lucide-react-native";

// ─── Center on User ──────────────────────────────────────────────────────────

interface CenterButtonProps {
  isFollowing: boolean;
  onPress: () => void;
}

export function CenterOnUserButton({ isFollowing, onPress }: CenterButtonProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Center on my location"
      activeOpacity={0.8}
      onPress={onPress}
      className="w-11 h-11 rounded-full items-center justify-center bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] shadow-md elevation-6"
    >
      <LocateFixed
        size={20}
        strokeWidth={2.35}
        color={isFollowing ? "#FB8500" : isDark ? "#D1D5DB" : "#475569"}
      />
    </TouchableOpacity>
  );
}

// ─── Align North ─────────────────────────────────────────────────────────────

interface NorthButtonProps {
  isNorthUp: boolean;
  normalizedHeading: number;
  onPress: () => void;
}

export function AlignNorthButton({ isNorthUp, normalizedHeading, onPress }: NorthButtonProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Face north"
      activeOpacity={0.8}
      onPress={onPress}
      className="w-11 h-11 rounded-full items-center justify-center bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] shadow-md elevation-6"
    >
      {/* Wrap in a View so React Native handles rotation correctly on all angles */}
      <View style={{ transform: [{ rotate: `${-normalizedHeading}deg` }] }}>
        <Navigation2
          size={20}
          strokeWidth={2.35}
          color={isNorthUp ? "#FB8500" : isDark ? "#D1D5DB" : "#475569"}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Heading Up ──────────────────────────────────────────────────────────────

interface HeadingUpButtonProps {
  enabled: boolean;
  onPress: () => void;
}

export function HeadingUpButton({ enabled, onPress }: HeadingUpButtonProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={enabled ? "Disable heading up" : "Enable heading up"}
      activeOpacity={0.8}
      onPress={onPress}
      className="w-11 h-11 rounded-full items-center justify-center bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] shadow-md elevation-6"
    >
      <Compass
        size={20}
        strokeWidth={2.35}
        color={enabled ? "#FB8500" : isDark ? "#D1D5DB" : "#475569"}
      />
    </TouchableOpacity>
  );
}

// ─── Composite container ─────────────────────────────────────────────────────

interface MapControlButtonsProps {
  isFollowing: boolean;
  isHeadingUpEnabled: boolean;
  isNorthUp: boolean;
  normalizedHeading: number;
  hasRoute: boolean;
  onCenterPress: () => void;
  onHeadingUpPress: () => void;
  onNorthPress: () => void;
}

export function MapControlButtons({
  isFollowing,
  isHeadingUpEnabled,
  isNorthUp,
  normalizedHeading,
  hasRoute,
  onCenterPress,
  onHeadingUpPress,
  onNorthPress,
}: MapControlButtonsProps) {
  return (
    <View
      className="absolute right-4 z-50 items-center gap-3"
      style={{ top: hasRoute ? 194 : 148 }}
    >
      <CenterOnUserButton isFollowing={isFollowing} onPress={onCenterPress} />
      <HeadingUpButton enabled={isHeadingUpEnabled} onPress={onHeadingUpPress} />
      <AlignNorthButton
        isNorthUp={isNorthUp}
        normalizedHeading={normalizedHeading}
        onPress={onNorthPress}
      />
    </View>
  );
}
