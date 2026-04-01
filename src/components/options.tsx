import React, { useState } from "react";
import { Modal, Pressable, TouchableOpacity, useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type OptionItem = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  options: OptionItem[];
  iconColor?: string;
  offsetTop?: number;
  offsetRight?: number;
};

export function OptionsMenu({ options, iconColor, offsetTop, offsetRight = 12 }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";

  const top = offsetTop ?? insets.top + 52;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="w-10 h-10 rounded-full items-center justify-center"
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="more-vert"
          size={20}
          color={iconColor ?? (isDark ? "#F1F5F9" : "#0F172A")}
        />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: "absolute",
              top,
              right: offsetRight,
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 8,
              minWidth: 135,
              paddingVertical: 2,
            }}
          >
            {options.map((opt, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <View style={{ height: 1, backgroundColor: isDark ? "#2a2a2a" : "#F1F5F9", marginHorizontal: 14 }} />
                )}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setOpen(false);
                    opt.onPress();
                  }}
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, gap: 10 }}
                >
                  {opt.icon}
                  <Text
                    className={`text-xs font-poppins-semibold ${
                      opt.destructive
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-700 dark:text-slate-100"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
