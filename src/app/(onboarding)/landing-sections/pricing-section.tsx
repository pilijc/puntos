import React, { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text } from "@/tw";

import { PRIMARY_ICON, PricingTierCard } from "./ui-blocks";

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
  plansLoading: boolean;
  plansError: string | null;
  basicPlan: Record<string, unknown> | null;
  proPlan: Record<string, unknown> | null;
};

export function LandingPricingSection({
  onSectionLayout,
  plansLoading,
  plansError,
  basicPlan,
  proPlan,
}: Props) {
  const { t } = useTranslation();

  const basicPricingInclusions = useMemo(
    () => [
      t("onboarding.landing.pricingBasicInc1"),
      t("onboarding.landing.pricingBasicInc2"),
      t("onboarding.landing.pricingBasicInc3"),
      t("onboarding.landing.pricingBasicInc4"),
      t("onboarding.landing.pricingBasicInc5"),
    ],
    [t],
  );

  const proPricingInclusions = useMemo(
    () => [
      t("onboarding.landing.pricingProInc1"),
      t("onboarding.landing.pricingProInc2"),
      t("onboarding.landing.pricingProInc3"),
      t("onboarding.landing.pricingProInc4"),
      t("onboarding.landing.pricingProInc6"),
      t("onboarding.landing.pricingProInc7"),
      t("onboarding.landing.pricingProInc8"),
    ],
    [t],
  );

  return (
    <View
      onLayout={onSectionLayout}
      className="bg-white px-4 py-16 dark:bg-darkBackgroundMuted md:px-10"
    >
      <View className="mx-auto w-full max-w-6xl">
        <Text className="mb-3 text-center font-poppins-bold text-3xl text-textPrimary dark:text-darkTextPrimary">
          {t("onboarding.landing.pricingTitle")}
        </Text>
        <Text className="mb-10 text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
          {t("onboarding.landing.pricingSub")}
        </Text>
        {plansLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={PRIMARY_ICON} />
          </View>
        ) : plansError ? (
          <Text className="text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
            {plansError}
          </Text>
        ) : !basicPlan && !proPlan ? (
          <Text className="text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
            {t("onboarding.landing.pricingEmpty")}
          </Text>
        ) : (
          <View className="mx-auto flex w-full max-w-[900px] flex-row flex-nowrap items-center justify-center gap-6 overflow-x-auto px-2 py-1">
            {basicPlan ? (
              <PricingTierCard
                plan={basicPlan}
                tier="basic"
                nameFallback={t("onboarding.landing.pricingFallbackBasic")}
                features={basicPricingInclusions}
              />
            ) : null}
            {proPlan ? (
              <PricingTierCard
                plan={proPlan}
                tier="pro"
                nameFallback={t("onboarding.landing.pricingFallbackPro")}
                features={proPricingInclusions}
              />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
