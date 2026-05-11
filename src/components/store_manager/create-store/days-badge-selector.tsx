import React from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { STORE_DAYS } from "@/type/store-manager/store";

type DaysBadgeSelectorProps = {
  selectedDays: string[];
  onToggle: (day: string) => void;
  t: (key: string) => string;
};

export function DaysBadgeSelector({
  selectedDays,
  onToggle,
  t,
}: DaysBadgeSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STORE_DAYS.map((day) => {
        const selected = selectedDays.includes(day.value);
        return (
          <TouchableOpacity
            key={day.value}
            activeOpacity={0.8}
            onPress={() => onToggle(day.value)}
            className={`px-3 py-1.5 rounded-full border ${
              selected
                ? "border-primary dark:border-primary "
                : "border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-800/50"
            }`}
          >
            <Text
              className={`text-xs font-poppins-medium ${
                selected ? "text-primary" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t(`store_manager.createStore.days.${day.shortKey}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
