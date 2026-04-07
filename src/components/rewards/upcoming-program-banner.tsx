import React from "react";
import { View, Text, AnimatedView } from "@/tw";
import { CalendarClock, Flame, Sparkles } from "lucide-react-native";
import { FadeIn, Layout } from "react-native-reanimated";

interface UpcomingProgramBannerProps {
  type: "streak" | "stamp";
  title?: string | null;
  startAt?: string | null;
  endDate?: string | null;
  /** For streaks: how many days long. For stamps: how many stamps required. */
  programLength?: number | null;
  description?: string | null;
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function UpcomingProgramBanner({
  type,
  title,
  startAt,
  endDate,
  programLength,
  description,
}: UpcomingProgramBannerProps) {
  const isStreak = type === "streak";
  const Icon = isStreak ? Flame : Sparkles;
  const iconColor = "#6366f1"; // indigo — distinct from orange (active) and grey (empty)

  const formattedStart = formatDate(startAt);
  const formattedEnd = formatDate(endDate);

  const programLabel = isStreak
    ? programLength
      ? `${programLength}-Day Streak Program`
      : "Streak Program"
    : programLength
    ? `${programLength}-Stamp Program`
    : "Stamp Program";

  return (
    <AnimatedView
      entering={FadeIn.duration(400)}
      layout={Layout.duration(300)}
      className="bg-white dark:bg-darkBackgroundMuted rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mx-1"
    >
      {/* ── Top accent bar ── */}
      <View className="h-1 bg-indigo-400 dark:bg-indigo-600" />

      <View className="p-4">
        {/* ── Header row ── */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-x-2">
            <View className="w-6 h-6 items-center justify-center">
              <Icon size={16} color={iconColor} />
            </View>
            <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
              {isStreak ? "Streak Log" : "Stamp Log"}
            </Text>
          </View>
          {/* Upcoming badge */}
          <View className="bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-full flex-row items-center gap-x-1 border border-indigo-200 dark:border-indigo-700">
            <CalendarClock size={11} color={iconColor} />
            <Text className="text-[10px] font-poppins-semibold text-indigo-600 dark:text-indigo-400">
              UPCOMING
            </Text>
          </View>
        </View>

        {/* ── Program name & dates card ── */}
        <View className="bg-indigo-50/60 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/40">
          <Text className="font-poppins-bold text-sm text-neutral-900 dark:text-neutral-100 mb-1" numberOfLines={1}>
            {title ?? programLabel}
          </Text>

          {(formattedStart || formattedEnd) && (
            <View className="flex-row items-center gap-x-1.5 flex-wrap">
              <CalendarClock size={12} color="#6366f1" />
              <Text className="text-[11px] font-poppins text-neutral-500 dark:text-neutral-400">
                {formattedStart && formattedEnd
                  ? `${formattedStart} – ${formattedEnd}`
                  : formattedStart
                  ? `Starts ${formattedStart}`
                  : `Ends ${formattedEnd}`}
              </Text>
            </View>
          )}

          {description && (
            <Text
              className="text-[11px] font-poppins text-neutral-500 dark:text-neutral-400 mt-1.5"
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        {/* ── Footer note ── */}
        <Text className="text-[10px] font-poppins text-indigo-400 dark:text-indigo-500 text-center mt-3 px-2">
          {isStreak
            ? "A new Streak program is coming soon. Stay tuned!"
            : "A new Stamp program is coming soon. Stay tuned!"}
        </Text>
      </View>
    </AnimatedView>
  );
}
