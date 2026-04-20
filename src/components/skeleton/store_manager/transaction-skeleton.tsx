import React, { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";
import { View } from "@/tw";

const ROWS_PER_GROUP = [3, 4, 2];

const DETAIL_WIDTH_PX: number[] = [92, 110, 98, 124, 104, 90, 116, 106];
const TIME_WIDTHS: number[] = [44, 56, 48, 60, 52];

function SkeletonTxRow({
  opacity,
  rowIndex,
  isFirst,
  isLast,
}: {
  opacity: Animated.Value;
  rowIndex: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const detailW = DETAIL_WIDTH_PX[rowIndex % DETAIL_WIDTH_PX.length];
  const timeW = TIME_WIDTHS[rowIndex % TIME_WIDTHS.length];
  const isWeb = Platform.OS === "web";

  return (
    <View
      className={[
        "flex-row items-center px-4 py-3 bg-background dark:bg-darkBackground border-l border-r border-b border-slate-100 dark:border-[#262626]",
        !isWeb && "mx-4",
        isFirst && "border-t rounded-tl-[12px] rounded-tr-[12px]",
        isLast && "rounded-bl-[12px] rounded-br-[12px]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="relative mr-3">
        <Animated.View
          className="size-10 rounded-full bg-slate-200 dark:bg-neutral-700"
          style={{ opacity }}
        />
        <Animated.View
          className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full border-[1.5px] border-slate-100 dark:border-[#262626] bg-slate-200 dark:bg-neutral-700"
          style={{ opacity }}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Animated.View
            className="mr-2 h-[13px] flex-1 rounded-md bg-slate-200 dark:bg-neutral-700"
            style={{ opacity }}
          />
          <Animated.View
            className="h-[13px] rounded-md bg-slate-200 dark:bg-neutral-700"
            style={{ opacity, width: detailW }}
          />
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Animated.View
            className="mr-2 h-[10px] flex-1 rounded-[5px] bg-slate-200 dark:bg-neutral-700"
            style={{ opacity }}
          />
          <Animated.View
            className="h-[10px] rounded-[5px] bg-slate-200 dark:bg-neutral-700"
            style={{ opacity, width: timeW }}
          />
        </View>
      </View>
    </View>
  );
}

export function TransactionSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isWeb = Platform.OS === "web";

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
          <View className={isWeb ? "items-center px-4 pb-2 pt-3" : "px-6 pb-2 pt-3"}>
            <View className={isWeb ? "w-full max-w-4xl self-center" : ""}>
              <Animated.View
                className="h-[9px] w-24 rounded-[5px] bg-slate-200 dark:bg-neutral-700"
                style={{ opacity }}
              />
            </View>
          </View>

          {Array.from({ length: rowCount }).map((_, i) => {
            const idx = absoluteRowIndex++;
            return (
              <View key={i} className={isWeb ? "px-4" : ""}>
                <View className={isWeb ? "w-full max-w-4xl self-center" : ""}>
                  <SkeletonTxRow
                    opacity={opacity}
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

function SkeletonPill({ opacity, className }: { opacity: Animated.Value; className: string }) {
  return (
    <Animated.View
      className={`h-7 rounded-full bg-slate-200 dark:bg-neutral-700 ${className}`}
      style={{ opacity }}
    />
  );
}

export function StoresAndFunnelSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return isWeb ? (
    <View className="bg-backgroundMuted dark:bg-darkBackground px-4 pb-3 pt-4 items-center">
      <View className="w-full max-w-4xl flex-row items-center overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-darkBorder dark:bg-darkBackground">
        <View className="flex-1 py-[10px] pl-1 pr-4">
          <View className="flex-row items-center gap-2">
            <SkeletonPill opacity={opacity} className="w-[92px]" />
            <SkeletonPill opacity={opacity} className="w-[78px]" />
            <SkeletonPill opacity={opacity} className="w-[102px]" />
          </View>
        </View>

        <View className="self-stretch items-center justify-center border-l border-slate-100 bg-white px-[14px] py-[10px] dark:border-[#262626] dark:bg-darkBackground">
          <Animated.View
            className="size-4 rounded bg-slate-200 dark:bg-neutral-700"
            style={{ opacity }}
          />
        </View>
      </View>
    </View>
  ) : (
    <View className="flex-row items-center border-b border-neutral-100 bg-background dark:border-darkBorder dark:bg-darkBackground">
      <View className="flex-1 py-[10px] pl-1 pr-4">
        <View className="flex-row items-center gap-2">
          <SkeletonPill opacity={opacity} className="w-[92px]" />
          <SkeletonPill opacity={opacity} className="w-[78px]" />
          <SkeletonPill opacity={opacity} className="w-[102px]" />
        </View>
      </View>

      <View className="self-stretch items-center justify-center border-l border-slate-100 bg-background px-[14px] py-[10px] dark:border-[#262626] dark:bg-darkBackground">
        <Animated.View
          className="size-4 rounded bg-slate-200 dark:bg-neutral-700"
          style={{ opacity }}
        />
      </View>
    </View>
  );
}
