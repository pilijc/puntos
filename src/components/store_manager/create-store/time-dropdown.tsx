import React, { useState } from "react";
import { Pressable } from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

type TimeDropdownProps = {
  value: string | null | undefined;
  onChange: (v: string) => void;
  isDark: boolean;
  defaultValue?: string;
};

export function TimeDropdown({
  value,
  onChange,
  isDark,
  defaultValue = "09:00",
}: TimeDropdownProps) {
  const [showH, setShowH] = useState(false);
  const [showM, setShowM] = useState(false);

  const parts = (value || defaultValue).split(":");
  const currentH = (parts[0] ?? "09").padStart(2, "0");
  const rawM = parseInt(parts[1] ?? "0", 10);
  const currentM = String(Math.min(55, Math.round(rawM / 5) * 5)).padStart(2, "0");

  const dropBg = isDark ? "#262626" : "#fff";
  const dropBorder = isDark ? "#404040" : "#e2e8f0";

  const closeDropdowns = () => {
    setShowH(false);
    setShowM(false);
  };

  return (
    <View className="flex-row items-center gap-x-2" style={{ position: "relative" }}>
      {(showH || showM) && (
        <Pressable
          style={{
            position: "absolute",
            left: -1000,
            top: -1000,
            width: 3000,
            height: 3000,
            zIndex: 20,
            backgroundColor: "transparent",
          }}
          onPress={closeDropdowns}
        />
      )}

      <View style={{ flex: 1, zIndex: 30 }}>
        <TouchableOpacity
          onPress={() => { setShowH(!showH); setShowM(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 h-12"
        >
          <Text className="font-poppins text-slate-900 dark:text-slate-100">{currentH}</Text>
          {showH ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
        {showH && (
          <ScrollView
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              zIndex: 40,
              backgroundColor: dropBg,
              borderRadius: 12,
              maxHeight: 180,
              borderWidth: 1,
              borderColor: dropBorder,
              elevation: 6,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {HOURS_24.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => { onChange(`${h}:${currentM}`); setShowH(false); }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  backgroundColor: h === currentH ? "rgba(255,102,0,0.10)" : "transparent",
                }}
              >
                <Text className="font-poppins text-sm text-textPrimary">{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Text className="font-poppins-semibold text-slate-400 text-base">:</Text>

      <View style={{ flex: 1, zIndex: 30 }}>
        <TouchableOpacity
          onPress={() => { setShowM(!showM); setShowH(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 h-12"
        >
          <Text className="font-poppins text-slate-900 dark:text-slate-100">{currentM}</Text>
          {showM ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
        {showM && (
          <ScrollView
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              zIndex: 40,
              backgroundColor: dropBg,
              borderRadius: 12,
              maxHeight: 180,
              borderWidth: 1,
              borderColor: dropBorder,
              elevation: 6,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {MINUTES_5.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { onChange(`${currentH}:${m}`); setShowM(false); }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  backgroundColor: m === currentM ? "rgba(255,102,0,0.10)" : "transparent",
                }}
              >
                <Text className="font-poppins text-sm text-textPrimary">{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
