import React from "react";
import type { LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text } from "@/tw";

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
};

export function LandingCtaSection({ onSectionLayout }: Props) {
  const { t } = useTranslation();

  return (
    <View
      onLayout={onSectionLayout}
      className="bg-primary px-4 py-10 md:px-10 md:py-10"
    >
      <View className="mx-auto w-full max-w-3xl items-center gap-y-1">
        <Text className="text-center font-poppins-bold text-2xl leading-tight text-white">
          {t("onboarding.landing.ctaTitle")}
        </Text>
        <Text className="text-center font-poppins text-base leading-relaxed text-white/90">
          {t("onboarding.landing.ctaSub")}
        </Text>
      </View>
    </View>
  );
}
