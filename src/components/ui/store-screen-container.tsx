import { SafeAreaView, ScrollView } from "@/tw";
import React from "react";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

interface StoreScreenContainerProps
  extends React.ComponentProps<typeof ScrollView> {
  backgroundClassName?: string;
  contentContainerClassName?: string;
  horizontalPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
  contentGap?: number;
  edges?: Edge[];
}

export default function StoreScreenContainer({
  backgroundClassName = "bg-background dark:bg-darkBackground",
  children,
  className = "flex-1",
  contentContainerClassName,
  contentContainerStyle,
  horizontalPadding = 24,
  topPadding = 24,
  bottomPadding = 40,
  contentGap,
  edges = ["left", "right"],
  ...scrollViewProps
}: StoreScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className={`flex-1 ${backgroundClassName}`.trim()} edges={edges}>
      <ScrollView
        className={className}
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName={contentContainerClassName}
        contentContainerStyle={[
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(insets.top, topPadding),
            paddingBottom: Math.max(insets.bottom, bottomPadding),
            rowGap: contentGap,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
