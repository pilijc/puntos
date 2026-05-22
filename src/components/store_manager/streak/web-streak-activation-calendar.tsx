import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { logger } from "@/utils/logger";

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseLocalDateKey(key: string): Date {
  const [y, mo, d] = key.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

const DAYS_AHEAD = 90;

type Props = {
  minActivationAt: Date;
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  isDark: boolean;
};

export function WebStreakActivationCalendar({
  minActivationAt,
  selectedDateKey,
  onSelectDateKey,
  isDark,
}: Props) {
  const minDay = useMemo(() => startOfLocalDay(minActivationAt), [minActivationAt]);
  const maxDay = useMemo(() => {
    const x = new Date(minDay);
    x.setDate(x.getDate() + DAYS_AHEAD - 1);
    return startOfLocalDay(x);
  }, [minDay]);

  const [viewYear, setViewYear] = useState(() => {
    try {
      return parseLocalDateKey(selectedDateKey).getFullYear();
    } catch {
      return minDay.getFullYear();
    }
  });
  const [viewMonth, setViewMonth] = useState(() => {
    try {
      return parseLocalDateKey(selectedDateKey).getMonth();
    } catch {
      return minDay.getMonth();
    }
  });

  useEffect(() => {
    try {
      const d = parseLocalDateKey(selectedDateKey);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } catch {
      logger.warn("Invalid date selection: unable to parse the selected date key.", selectedDateKey);
 
    }
  }, [selectedDateKey]);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth],
  );

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingEmpty = firstOfMonth.getDay();

  const canPrevMonth = useMemo(() => {
    const prevMonthLast = new Date(viewYear, viewMonth, 0);
    return startOfLocalDay(prevMonthLast).getTime() >= minDay.getTime();
  }, [viewYear, viewMonth, minDay]);

  const canNextMonth = useMemo(() => {
    const nextMonthFirst = new Date(viewYear, viewMonth + 1, 1);
    return startOfLocalDay(nextMonthFirst).getTime() <= maxDay.getTime();
  }, [viewYear, viewMonth, maxDay]);

  const goPrev = () => {
    if (!canPrevMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (!canNextMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const weekLetters = useMemo(() => {
    const letters: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2023, 0, 1 + i);
      letters.push(d.toLocaleDateString(undefined, { weekday: "narrow" }));
    }
    return letters;
  }, []);

  const accent = "#FF6600";
  const borderMuted = isDark ? "#525252" : "#e2e8f0";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cellBg = isDark ? "#404040" : "#ffffff";

  const cells: ({ day: number; key: string; disabled: boolean } | null)[] = [];
  for (let i = 0; i < leadingEmpty; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewYear, viewMonth, day);
    const key = formatLocalDateKey(cellDate);
    const t0 = cellDate.getTime();
    const disabled = t0 < minDay.getTime() || t0 > maxDay.getTime();
    cells.push({ day, key, disabled });
  }

  const weeks: ((typeof cells)[number] | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    weeks.push(row);
  }

  return (
    <View
      className="rounded-xl border p-3 gap-y-2"
      style={{ borderColor: borderMuted, backgroundColor: cellBg }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <TouchableOpacity
          onPress={goPrev}
          disabled={!canPrevMonth}
          className="p-2 rounded-lg"
          style={{ opacity: canPrevMonth ? 1 : 0.35 }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={22} color={isDark ? "#e2e8f0" : "#334155"} />
        </TouchableOpacity>
        <Text className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
          {monthLabel}
        </Text>
        <TouchableOpacity
          onPress={goNext}
          disabled={!canNextMonth}
          className="p-2 rounded-lg"
          style={{ opacity: canNextMonth ? 1 : 0.35 }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={22} color={isDark ? "#e2e8f0" : "#334155"} />
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-1">
        {weekLetters.map((letter, idx) => (
          <View key={`w-${idx}`} className="flex-1 items-center py-1">
            <Text style={{ fontSize: 11, color: textMuted, fontFamily: "Poppins-Medium" }}>
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={`week-${wi}`} className="flex-row">
          {week.map((cell, di) => {
            const slotKey = cell ? cell.key : `blank-${wi}-${di}`;
            if (!cell) {
              return <View key={slotKey} className="flex-1 p-0.5 aspect-square max-h-[44px]" />;
            }
            const selected = cell.key === selectedDateKey;
            return (
              <View key={cell.key} className="flex-1 p-0.5">
                <TouchableOpacity
                  disabled={cell.disabled}
                  onPress={() => onSelectDateKey(cell.key)}
                  className="flex-1 items-center justify-center rounded-lg min-h-[36px] aspect-square max-h-[44px]"
                  style={{
                    opacity: cell.disabled ? 0.35 : 1,
                    backgroundColor: selected ? (isDark ? "#431407" : "#FFF7ED") : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Poppins-Medium",
                      color: selected ? accent : isDark ? "#f1f5f9" : "#0f172a",
                    }}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
