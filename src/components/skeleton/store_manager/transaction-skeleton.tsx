import React, { useEffect, useRef } from "react";
import { Animated, useColorScheme, Platform } from "react-native";
import { View } from "@/tw";

const ROWS_PER_GROUP = [3, 4, 2];

const DETAIL_WIDTH_PX: number[] = [92, 110, 98, 124, 104, 90, 116, 106];
const LABEL_RADIUS = 6;
const TIME_WIDTHS: number[] = [44, 56, 48, 60, 52];

function SkeletonTxRow({
  opacity,
  bg,
  borderColor,
  cardBg,
  rowIndex,
  isFirst,
  isLast,
}: {
  opacity: Animated.Value;
  bg: string;
  borderColor: string;
  cardBg: string;
  rowIndex: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const detailW = DETAIL_WIDTH_PX[rowIndex % DETAIL_WIDTH_PX.length];
  const isWeb = Platform.OS === "web";

  return (
    <View
      className={[
        "flex-row items-center px-4 py-3 border-l border-r border-b",
        !isWeb && "mx-4",
        isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
        isLast && "rounded-bl-[12px] rounded-br-[12px]",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor, backgroundColor: cardBg }}
    >
      <View className="relative mr-3">
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: bg,
            opacity,
          }}
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
            borderWidth: 1.5,
            borderColor,
          }}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Animated.View
            style={{
              flex: 1,
              marginRight: 8,
              height: 13,
              borderRadius: LABEL_RADIUS,
              backgroundColor: bg,
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: detailW,
              height: 13,
              borderRadius: LABEL_RADIUS,
              backgroundColor: bg,
              opacity,
            }}
          />
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <Animated.View
            style={{
              flex: 1,
              marginRight: 8,
              height: 10,
              borderRadius: 5,
              backgroundColor: bg,
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: TIME_WIDTHS[rowIndex % TIME_WIDTHS.length],
              height: 10,
              borderRadius: 5,
              backgroundColor: bg,
              opacity,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export function TransactionSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";
  const maxWidth = 860;

  const bg = isDark ? "#2a2a2a" : "#E2E8F0";
  const borderColor = isDark ? "#262626" : "#F1F5F9";
  const cardBg = isDark ? "#1c1c1c" : "#ffffff";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  let absoluteRowIndex = 0;

  return (
    <View className="flex-1">
      {ROWS_PER_GROUP.map((rowCount, groupIndex) => (
        <View key={groupIndex}>
          <View className={isWeb ? "px-4 pt-3 pb-2 items-center" : "px-6 pt-3 pb-2"}>
            <View style={isWeb ? { width: "100%", maxWidth } : undefined}>
              <Animated.View
                style={{ width: 96, height: 9, borderRadius: 5, backgroundColor: bg, opacity }}
              />
            </View>
          </View>

          {Array.from({ length: rowCount }).map((_, i) => {
            const idx = absoluteRowIndex++;
            return (
              <View key={i} className={isWeb ? "px-4" : ""}>
                <View style={isWeb ? { width: "100%", maxWidth, alignSelf: "center" } : undefined}>
                  <SkeletonTxRow
                    opacity={opacity}
                    bg={bg}
                    borderColor={borderColor}
                    cardBg={cardBg}
                    rowIndex={idx}
                    isFirst={i === 0}
                    isLast={i === rowCount - 1}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function SkeletonPill({ opacity, bg, w }: { opacity: Animated.Value; bg: string; w: number }) {
  return (
    <Animated.View
      className="h-7 rounded-full"
      style={{
        width: w,
        backgroundColor: bg,
        opacity,
      }}
    />
  );
}

export function StoresAndFunnelSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";
  const maxWidth = 860;

  const pillBg = isDark ? "#262626" : "#F1F5F9";
  const borderColor = isDark ? "#262626" : "#E2E8F0";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    isWeb ? (
      <View className="bg-backgroundMuted dark:bg-darkBackground px-4 pt-4 pb-3 items-center">
        <View
          className="w-full bg-white dark:bg-darkBackground border border-neutral-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row items-center"
          style={{ maxWidth }}
        >
          <View className="flex-1 pl-1 pr-4 py-[10px]">
            <View className="flex-row items-center gap-2">
              <SkeletonPill opacity={opacity} bg={pillBg} w={92} />
              <SkeletonPill opacity={opacity} bg={pillBg} w={78} />
              <SkeletonPill opacity={opacity} bg={pillBg} w={102} />
            </View>
          </View>

          <View
            className="self-stretch items-center justify-center px-[14px] py-[10px] border-l bg-white dark:bg-darkBackground"
            style={{
              borderLeftColor: borderColor,
            }}
          >
            <Animated.View
              className="w-4 h-4 rounded"
              style={{
                backgroundColor: pillBg,
                opacity,
              }}
            />
          </View>
        </View>
      </View>
    ) : (
      <View className="flex-row items-center bg-background dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder">
        <View className="flex-1 pl-1 pr-4 py-[10px]">
          <View className="flex-row items-center gap-2">
            <SkeletonPill opacity={opacity} bg={pillBg} w={92} />
            <SkeletonPill opacity={opacity} bg={pillBg} w={78} />
            <SkeletonPill opacity={opacity} bg={pillBg} w={102} />
          </View>
        </View>

        <View
          className="self-stretch items-center justify-center px-[14px] py-[10px] border-l bg-background dark:bg-darkBackground"
          style={{
            borderLeftColor: borderColor,
          }}
        >
          <Animated.View
            className="w-4 h-4 rounded"
            style={{
              backgroundColor: pillBg,
              opacity,
            }}
          />
        </View>
      </View>
    )
  );
}
