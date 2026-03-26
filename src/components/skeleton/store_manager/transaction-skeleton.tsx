import React, { useEffect, useRef } from "react";
import { Animated, useColorScheme } from "react-native";
import { View } from "@/tw";

const ROWS_PER_GROUP = [3, 4, 2];

const NAME_WIDTHS: `${number}%`[]   = ["55%", "65%", "48%", "72%", "58%", "44%", "68%", "52%"];
const DETAIL_WIDTHS: `${number}%`[] = ["40%", "50%", "35%", "55%", "38%", "48%", "42%", "36%"];
const TIME_WIDTHS  = [28, 32, 30, 36, 28];

function SkeletonRow({
  opacity,
  bg,
  divBg,
  rowIndex,
  isLast,
}: {
  opacity: Animated.Value;
  bg: string;
  divBg: string;
  rowIndex: number;
  isLast: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: divBg,
      }}
    >
      <View style={{ width: 38, height: 38, marginRight: 12 }}>
        <Animated.View
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: bg, opacity }}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: bg,
            opacity,
          }}
        />
      </View>

      <View style={{ flex: 1, gap: 6 }}>
        <Animated.View
          style={{ width: NAME_WIDTHS[rowIndex % NAME_WIDTHS.length], height: 13, borderRadius: 5, backgroundColor: bg, opacity }}
        />
        <Animated.View
          style={{ width: DETAIL_WIDTHS[rowIndex % DETAIL_WIDTHS.length], height: 10, borderRadius: 4, backgroundColor: bg, opacity }}
        />
      </View>

      <Animated.View
        style={{ width: TIME_WIDTHS[rowIndex % TIME_WIDTHS.length], height: 10, borderRadius: 4, backgroundColor: bg, opacity, marginLeft: 8 }}
      />
    </View>
  );
}

export function TransactionSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isDark  = useColorScheme() === "dark";

  const bg    = isDark ? "#2a2a2a" : "#E2E8F0";
  const divBg = isDark ? "#262626" : "#F1F5F9";
  const cardBg = isDark ? "#1c1c1c" : "#ffffff";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  let absoluteRowIndex = 0;

  return (
    <View style={{ flex: 1 }}>
      {ROWS_PER_GROUP.map((rowCount, groupIndex) => (
        <View key={groupIndex}>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 6 }}>
            <Animated.View
              style={{ width: 56, height: 9, borderRadius: 4, backgroundColor: bg, opacity }}
            />
          </View>

          <View style={{ backgroundColor: cardBg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: divBg }}>
            {Array.from({ length: rowCount }).map((_, i) => {
              const idx = absoluteRowIndex++;
              return (
                <SkeletonRow
                  key={i}
                  opacity={opacity}
                  bg={bg}
                  divBg={divBg}
                  rowIndex={idx}
                  isLast={i === rowCount - 1}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
