import React, { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text } from "@/tw";
import { ChevronRight, ChevronDown } from "lucide-react-native";

import { HowItWorksStepCard } from "./ui-blocks";

const HOW_STEP_BADGE_COLORS = ["#FF6600", "#FF6600", "#FF6600"] as const;
const HOW_STEP_IMAGES = [
  require("../../../assets/images/step-1.png"),
  require("../../../assets/images/step-2.png"),
  require("../../../assets/images/step-3.png"),
] as const;

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
};

export function LandingHowSection({ onSectionLayout }: Props) {
  const { t } = useTranslation();

  const steps = useMemo(
    () => [
      {
        n: 1,
        title: t("onboarding.landing.step1Title"),
        desc: t("onboarding.landing.step1Desc"),
      },
      {
        n: 2,
        title: t("onboarding.landing.step2Title"),
        desc: t("onboarding.landing.step2Desc"),
      },
      {
        n: 3,
        title: t("onboarding.landing.step3Title"),
        desc: t("onboarding.landing.step3Desc"),
      },
    ],
    [t],
  );

  return (
    <View
      onLayout={onSectionLayout}
      className="bg-white px-4 py-14 dark:border-darkBorder dark:bg-darkBackground md:px-10 md:py-20"
    >
      <View className="mx-auto w-full max-w-6xl">
        <View className="mb-10 items-center md:mb-14">
          <Text className="mb-1 text-center font-poppins-bold text-2xl tracking-tight text-textPrimary dark:text-darkTextPrimary md:text-3xl">
            {t("onboarding.landing.howTitleMain")}
          </Text>
          <Text className="text-center font-poppins-bold text-xl text-primary dark:text-darkTextSecondary md:text-2xl">
            {t("onboarding.landing.howTitleSub")}
          </Text>
        </View>

        <View className="flex-col items-stretch gap-8 md:flex-row md:items-start md:justify-center md:gap-3 lg:gap-4">
          {steps.map((s, index) => (
            <React.Fragment key={s.n}>
              {index > 0 ? (
                <View className="items-center justify-center py-0 md:w-6 md:shrink-0 md:self-center md:py-12">
                  <View className="md:hidden">
                    <ChevronDown size={22} color="#cbd5e1" />
                  </View>
                  <View className="hidden md:flex">
                    <ChevronRight size={22} color="#cbd5e1" />
                  </View>
                </View>
              ) : null}
              <HowItWorksStepCard
                stepNumber={s.n}
                title={s.title}
                description={s.desc}
                badgeColor={
                  HOW_STEP_BADGE_COLORS[index] ?? HOW_STEP_BADGE_COLORS[0]
                }
                imageSource={HOW_STEP_IMAGES[index] ?? HOW_STEP_IMAGES[0]}
              />
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}
