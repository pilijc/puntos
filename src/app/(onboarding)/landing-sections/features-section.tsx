import React, { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text } from "@/tw";
import {
  Smartphone,
  QrCode,
  Gift,
  BarChart3,
  Ticket,
  Monitor,
} from "lucide-react-native";

import { FeatureCard } from "./ui-blocks";

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
};

export function LandingFeaturesSection({ onSectionLayout }: Props) {
  const { t } = useTranslation();

  const features = useMemo(
    () =>
      [
        {
          title: t("onboarding.landing.feat1Title"),
          description: t("onboarding.landing.feat1Desc"),
          Icon: Smartphone,
        },
        {
          title: t("onboarding.landing.feat2Title"),
          description: t("onboarding.landing.feat2Desc"),
          Icon: QrCode,
        },
        {
          title: t("onboarding.landing.feat3Title"),
          description: t("onboarding.landing.feat3Desc"),
          Icon: Gift,
        },
        {
          title: t("onboarding.landing.feat4Title"),
          description: t("onboarding.landing.feat4Desc"),
          Icon: BarChart3,
        },
        {
          title: t("onboarding.landing.feat5Title"),
          description: t("onboarding.landing.feat5Desc"),
          Icon: Ticket,
        },
        {
          title: t("onboarding.landing.feat6Title"),
          description: t("onboarding.landing.feat6Desc"),
          Icon: Monitor,
        },
      ] as const,
    [t],
  );

  return (
    <View
      onLayout={onSectionLayout}
      className="bg-white px-4 py-14 dark:border-darkBorder dark:bg-darkBackground md:px-10 md:py-16"
    >
      <View className="mx-auto w-full max-w-6xl">
        <View className="mx-auto mb-10 max-w-xl md:mb-12">
          <Text className="mb-2 text-center font-poppins-bold text-2xl tracking-tight text-textPrimary dark:text-darkTextPrimary md:text-3xl">
            {t("onboarding.landing.featuresTitle")}
          </Text>
          <Text className="text-center font-poppins text-sm leading-6 text-textSecondary dark:text-darkTextSecondary md:text-[15px]">
            {t("onboarding.landing.featuresSub")}
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </View>
      </View>
    </View>
  );
}
