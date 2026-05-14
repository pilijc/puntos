import React from "react";
import { useColorScheme } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, Image, TouchableOpacity } from "@/tw";
import { Button } from "@/components/button";

import type { LandingSection } from "./types";
import { HeroWaveBackground, NavLink } from "./ui-blocks";

type Props = {
  isWide: boolean;
  heroBandSize: { w: number; h: number };
  onHeroBandLayout: (e: LayoutChangeEvent) => void;
  onHeroSectionLayout: (e: LayoutChangeEvent) => void;
  scrollNavTo: (key: LandingSection) => void;
  goLogin: () => void;
  goWelcome: () => void;
};

export function LandingHeroBandSection({
  isWide,
  heroBandSize,
  onHeroBandLayout,
  onHeroSectionLayout,
  scrollNavTo,
  goLogin,
  goWelcome,
}: Props) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";

  return (
    <View
      className="relative w-full overflow-hidden"
      onLayout={onHeroBandLayout}
    >
      <HeroWaveBackground
        width={heroBandSize.w}
        height={heroBandSize.h}
        isDark={isDark}
      />
      <View className="relative z-10 px-4 py-2 md:px-10 md:pb-2 md:pt-4">
        <View className="mx-auto w-full max-w-6xl flex-row flex-wrap items-center justify-between gap-y-3">
          <Image
            source={require("../../../assets/images/puntos-icon.png")}
            className="h-12 w-12"
            resizeMode="contain"
          />
          <View className="hidden flex-1 flex-row flex-wrap items-center justify-center gap-1 lg:flex">
            <NavLink
              label={t("onboarding.landing.nav.overview")}
              section="hero"
              onNavigate={scrollNavTo}
            />
            <NavLink
              label={t("onboarding.landing.nav.features")}
              section="features"
              onNavigate={scrollNavTo}
            />
            <NavLink
              label={t("onboarding.landing.nav.howItWorks")}
              section="how"
              onNavigate={scrollNavTo}
            />
            <NavLink
              label={t("onboarding.landing.nav.pricing")}
              section="pricing"
              onNavigate={scrollNavTo}
            />
            <NavLink
              label={t("onboarding.landing.nav.footer")}
              section="footer"
              onNavigate={scrollNavTo}
            />
          </View>
          <View className="flex-row items-center gap-3">
            <Button
              label={t("onboarding.landing.signIn")}
              onPress={goLogin}
              variant="primary"
              roundedFull={true}
              fitContent={true}
            />
          </View>
        </View>
      </View>

      <View
        onLayout={onHeroSectionLayout}
        className="relative z-10 mx-auto w-full max-w-6xl py-6 md:py-10"
      >
        <View
          className={`flex-col gap-10 ${isWide ? "md:flex-row md:items-center" : ""}`}
        >
          <View className="flex-1 gap-5">
            <Text className="font-poppins-bold text-4xl leading-tight text-textPrimary dark:text-darkTextPrimary md:text-5xl">
              {t("onboarding.landing.heroLine1")}{" "}
              <Text className="text-primary dark:text-darkPrimaryText">
                {t("onboarding.landing.heroHighlight")}
              </Text>
            </Text>
            <Text className="max-w-xl font-poppins text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary md:text-base">
              {t("onboarding.landing.heroSub")}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={goWelcome}
                className="rounded-full bg-primary px-6 py-3"
                accessibilityRole="button"
              >
                <Text className="font-poppins-semibold text-base text-white">
                  {t("onboarding.landing.getStarted")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-2xl overflow-hidden rounded-2xl p-6">
              <Image
                source={require("../../../assets/images/landing.png")}
                className="h-[480px] w-full rounded-lg md:h-[520px]"
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
